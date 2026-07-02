import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Minimal file logger. Writes one JSON line per event to
 * `logs/app-YYYY-MM-DD.log` (override the directory with LOG_DIR) and mirrors
 * to the console so pm2 logs keep working. Logging must never break a
 * request, so all failures are swallowed after a single console warning.
 */

const LOG_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), "logs");

let dirReady: Promise<void> | null = null;
let warnedOnce = false;

function ensureDir(): Promise<void> {
  if (!dirReady) {
    dirReady = mkdir(LOG_DIR, { recursive: true }).then(() => undefined);
  }
  return dirReady;
}

function logFilePath(now: Date): string {
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `app-${day}.log`);
}

export type LogLevel = "info" | "warn" | "error";

async function write(level: LogLevel, event: string, data?: unknown) {
  const now = new Date();
  const entry = {
    ts: now.toISOString(),
    level,
    event,
    ...(data === undefined ? {} : { data }),
  };
  const line = JSON.stringify(entry);

  // Mirror to console so pm2 logs still show everything.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  try {
    await ensureDir();
    await appendFile(logFilePath(now), `${line}\n`, "utf8");
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
