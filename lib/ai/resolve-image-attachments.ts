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

async function toDataUri(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;

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
            return { ...p, url: cache.get(p.url) };
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
