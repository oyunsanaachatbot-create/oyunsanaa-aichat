/** Postgres NOTIFY/LISTEN channel name for a conversation (identifier-safe). */
export function conversationChannel(conversationId: string): string {
  return `therapy_conv_${conversationId.replace(/[^a-zA-Z0-9]/g, "")}`;
}
