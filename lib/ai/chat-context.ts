export const CHAT_CONTEXT_MESSAGE_LIMIT = 12;

function isImageFilePart(part: unknown): boolean {
  if (!part || typeof part !== "object") return false;
  const candidate = part as { type?: string; mediaType?: string };
  return (
    candidate.type === "file" &&
    String(candidate.mediaType ?? "").startsWith("image/")
  );
}

/**
 * Keep a bounded recent transcript and only retain images attached to the
 * latest user turn. Older assistant text already contains the extracted
 * meaning, so re-sending old high-detail images on every turn is wasteful.
 */
export function prepareChatContextMessages<
  T extends {
    role?: string;
    parts?: unknown[];
  },
>(messages: T[]): T[] {
  const recent = messages.slice(-CHAT_CONTEXT_MESSAGE_LIMIT);
  let latestUserIndex = -1;
  for (let index = recent.length - 1; index >= 0; index--) {
    if (recent[index]?.role === "user") {
      latestUserIndex = index;
      break;
    }
  }

  return recent.map((message, index) => {
    if (index === latestUserIndex || !Array.isArray(message.parts)) {
      return message;
    }
    const parts = message.parts.filter((part) => !isImageFilePart(part));
    return parts.length === message.parts.length
      ? message
      : ({ ...message, parts } as T);
  });
}

export function countChatImages(
  messages: Array<{ parts?: unknown[] }>
): number {
  return messages.reduce(
    (count, message) =>
      count + (message.parts?.filter(isImageFilePart).length ?? 0),
    0
  );
}
