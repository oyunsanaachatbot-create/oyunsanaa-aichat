/**
 * Chat image attachments are stored as our own HTTP URLs
 * (/api/uploads/<bucket>/<path>, see lib/db/pgClient.ts). Handing a bare URL
 * straight to the model only works if the model provider's servers can reach
 * that URL over the public internet — which is true in production
 * (https://app.oyunsanaa.com/...) but never true in local dev
 * (http://localhost:3000/... is only reachable from this machine). That
 * mismatch is why image messages silently failed ("Oops, an error occurred!")
 * when testing locally.
 *
 * Fixing it by fetching the bytes ourselves (this server CAN always reach its
 * own URL, local or not) and embedding them as a base64 data URI removes the
 * dependency entirely — the model receives the bytes inline, no outbound
 * fetch on the provider's side required, in every environment.
 */

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

async function toDataUri(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

  if (!isTrustedUploadUrl(url)) {
    throw new Error(`Refusing to fetch untrusted image attachment URL: ${url}`);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image attachment (${res.status}): ${url}`);
  }
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

function isImageFilePart(part: any): boolean {
  return (
    part?.type === "file" &&
    typeof part?.url === "string" &&
    String(part?.mediaType ?? "").startsWith("image/")
  );
}

/** Resolves the first image attachment's URL to a data URI, or null if none. */
export function resolveFirstImageDataUri(parts: any[]): Promise<string | null> {
  const imagePart = parts?.find(isImageFilePart);
  if (!imagePart) return Promise.resolve(null);
  return toDataUri(imagePart.url);
}

/**
 * Returns a shallow copy of `messages` with every image file-part's `url`
 * replaced by a fetched base64 data URI, so the model always receives
 * self-contained bytes instead of a possibly-unreachable URL.
 */
export function resolveImageAttachmentsToDataUris<T extends { parts?: any[] }>(
  messages: T[]
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
              cache.set(p.url, await toDataUri(p.url));
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
            console.error("[resolveImageAttachments] failed for", p.url, e);
            return p;
          }
        })
      );

      return { ...m, parts: newParts };
    })
  );
}
