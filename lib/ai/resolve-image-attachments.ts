import { getSql } from "@/lib/db/pgClient";
import { ownsPrivateUpload } from "@/lib/uploads/access";
/** Private attachment URLs are never sent to a provider. Read only the signed-in
 * owner's stored bytes and embed them after validating the origin/path. */

const UPLOAD_PATH_PREFIX = "/api/uploads/";

/** Env vars where the app's own public origin is configured. */
function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  for (const raw of [process.env.AUTH_URL, process.env.NEXTAUTH_URL]) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // ignore malformed env value
    }
  }
  return [...origins];
}

/**
 * SSRF guard: the server fetches whatever URL a chat file-part points at
 * (see file header). Without this check, a signed-in user could attach a
 * file part whose `url` targets an internal address (cloud metadata
 * endpoint, internal service) with an image mediaType, turning this into a
 * blind SSRF primitive. Only our own /api/uploads/ URLs — on our own
 * configured origin — are allowed through.
 */
function isTrustedUploadUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!parsed.pathname.startsWith(UPLOAD_PATH_PREFIX)) return false;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(parsed.origin);
  }
  // No AUTH_URL/NEXTAUTH_URL configured (local dev) — only trust localhost.
  return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
}

async function toDataUri(url: string, userId: string): Promise<string> {
  if (url.startsWith("data:image/") && url.length <= 7_000_000) return url;
  if (!isTrustedUploadUrl(url)) throw new Error("Untrusted image attachment");
  const parts = new URL(url).pathname.slice(UPLOAD_PATH_PREFIX.length).split("/").map(decodeURIComponent);
  const bucket = parts.shift() ?? "";
  if (!ownsPrivateUpload(bucket, parts, userId)) throw new Error("Image attachment not found");
  const sql = getSql();
  if (!sql) throw new Error("Storage unavailable");
  const [row] = await sql`SELECT content_type, data FROM blob_storage WHERE bucket = ${bucket} AND path = ${parts.join("/")} LIMIT 1`;
  if (!row || !String(row.content_type).startsWith("image/") || row.data.length > 5 * 1024 * 1024) throw new Error("Image attachment not found");
  return `data:${row.content_type};base64,${Buffer.from(row.data).toString("base64")}`;
}

function isImageFilePart(part: any): boolean {
  return (
    part?.type === "file" &&
    typeof part?.url === "string" &&
    String(part?.mediaType ?? "").startsWith("image/")
  );
}

/** Resolves the first image attachment's URL to a data URI, or null if none. */
export function resolveFirstImageDataUri(parts: any[], userId: string): Promise<string | null> {
  const imagePart = parts?.find(isImageFilePart);
  if (!imagePart) return Promise.resolve(null);
  return toDataUri(imagePart.url, userId);
}

/**
 * Returns a shallow copy of `messages` with every image file-part's `url`
 * replaced by a fetched base64 data URI, so the model always receives
 * self-contained bytes instead of a possibly-unreachable URL.
 */
export function resolveImageAttachmentsToDataUris<T extends { parts?: any[] }>(
  messages: T[], userId: string
): Promise<T[]> {
  const cache = new Map<string, string>();

  return Promise.all(
    messages.map(async (m) => {
      const parts = m.parts;
      if (!Array.isArray(parts) || !parts.some(isImageFilePart)) return m;

      const newParts = await Promise.all(
        parts.map(async (p: any) => {
          if (!isImageFilePart(p)) return p;
          try {
            if (!cache.has(p.url)) {
              cache.set(p.url, await toDataUri(p.url, userId));
            }
            return {
              ...p,
              url: cache.get(p.url),
              providerMetadata: {
                ...p.providerMetadata,
                openai: {
                  ...(p.providerMetadata?.openai ?? {}),
                  imageDetail: "high",
                },
              },
            };
          } catch (e) {
            throw new Error("Image attachment is unavailable or unauthorized");
          }
        })
      );

      return { ...m, parts: newParts };
    })
  );
}
