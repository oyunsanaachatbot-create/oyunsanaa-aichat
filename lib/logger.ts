/**
 * Minimal logger. Writes one JSON line per event to
 * `logs/app-YYYY-MM-DD.log` (override the directory with LOG_DIR) and mirrors
 * to the console so pm2 logs keep working. Logging must never break a
 * request, so all failures are swallowed after a single console warning.
 *
 * ⚠️ Edge-safe: this module is imported by `proxy.ts` (Next.js middleware,
 * which runs in the Edge Runtime). `node:fs`/`node:path` do NOT exist there,
 * so a static import would crash the middleware at module-load in a production
 * build — taking down EVERY matched route, including `/api/chat` (→ chat
 * "streaming doesn't work at all"). We therefore keep the console mirror
 * everywhere and load the Node file-system APIs lazily, only when an actual
 * Node runtime is present.
 */

// In the Edge Runtime, `process.env.NEXT_RUNTIME === "edge"` (and
// `globalThis.EdgeRuntime` is defined). File logging is only possible on Node.
// We deliberately avoid `process.versions`/`process.cwd()` (Node-only APIs the
// Edge bundler flags) and rely purely on env + the EdgeRuntime global.
const isNodeRuntime =
  typeof process !== "undefined" &&
  (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime === undefined &&
  process.env.NEXT_RUNTIME !== "edge";

let dirReady: Promise<void> | null = null;
let warnedOnce = false;

// Cache the lazily-loaded Node modules so we import them at most once.
let nodeFsp: typeof import("node:fs/promises") | null = null;
let nodePath: typeof import("node:path") | null = null;

async function loadNodeModules() {
  if (!nodeFsp) {
    // Variable (non-literal) specifiers so the bundler cannot statically
    // resolve these into the Edge Runtime bundle — this is what keeps
    // `node:fs`/`node:path` out of the middleware/instrumentation edge graph.
    const fspSpec = "node:fs/promises";
    const pathSpec = "node:path";
    nodeFsp = (await import(fspSpec)) as typeof import("node:fs/promises");
    nodePath = (await import(pathSpec)) as typeof import("node:path");
  }
  return { fsp: nodeFsp, path: nodePath as typeof import("node:path") };
}

export type LogLevel = "info" | "warn" | "error";

async function writeToFile(line: string, now: Date) {
  const { fsp, path } = await loadNodeModules();
  // Relative default ("logs") resolves against the process CWD at the fs layer
  // — avoids calling `process.cwd()` directly, which the Edge bundler flags.
  const logDir = process.env.LOG_DIR ?? "logs";
  if (!dirReady) {
    dirReady = fsp.mkdir(logDir, { recursive: true }).then(() => undefined);
  }
  await dirReady;
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
  await fsp.appendFile(path.join(logDir, `app-${day}.log`), `${line}\n`, "utf8");
}

async function write(level: LogLevel, event: string, data?: unknown) {
  const now = new Date();
  const entry = {
    ts: now.toISOString(),
    level,
    event,
    ...(data === undefined ? {} : { data }),
  };
  const line = JSON.stringify(entry);

  // Mirror to console so pm2 logs still show everything (works in every runtime).
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  // File logging is best-effort and Node-only. Never let it break a request.
  if (!isNodeRuntime) return;
  try {
    await writeToFile(line, now);
  } catch (err) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("logger: failed to write log file:", err);
    }
  }
}

export const logger = {
  info: (event: string, data?: unknown) => write("info", event, data),
  warn: (event: string, data?: unknown) => write("warn", event, data),
  error: (event: string, data?: unknown) => write("error", event, data),
};

/** Serialize an unknown error into something JSON-safe for the log line. */
export function serializeError(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
