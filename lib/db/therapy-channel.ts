/** Postgres NOTIFY/LISTEN channel name for a conversation (identifier-safe). */
export function conversationChannel(conversationId: string): string {
  return `therapy_conv_${conversationId.replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** Postgres NOTIFY/LISTEN channel for the direct psychologist inbox. */
export function psychologistConversationChannel(
  conversationId: string
): string {
  return `psychologist_conv_${conversationId.replace(/[^a-zA-Z0-9]/g, "")}`;
}
