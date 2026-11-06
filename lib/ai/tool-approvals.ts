/** Only the approval decision may come from the client; history and tool input stay server-owned. */
export function mergeToolApprovals<
  T extends { id: string; role: string; parts: unknown[] },
>(stored: T[], incoming: T[]): T[] | null {
  const byId = new Map(stored.map((message) => [message.id, message]));
  if (incoming.some((message) => byId.get(message.id)?.role !== message.role))
    return null;
  let accepted = false;
  const merged = stored.map((message) => {
    const update = incoming.find((item) => item.id === message.id);
    if (!update) return message;
    const parts = message.parts.map((part) => {
      if (!part || typeof part !== "object") return part;
      const original = part as Record<string, any>;
      if (original.state !== "approval-requested" || !original.approval?.id)
        return part;
      const decision = update.parts.find(
        (candidate: any) =>
          candidate?.type === original.type &&
          candidate?.toolCallId === original.toolCallId &&
          candidate?.approval?.id === original.approval.id &&
          ["approval-responded", "output-denied"].includes(candidate?.state)
      ) as Record<string, any> | undefined;
      if (!decision || typeof decision.approval?.approved !== "boolean")
        return part;
      accepted = true;
      return {
        ...original,
        state: decision.approval.approved
          ? "approval-responded"
          : "output-denied",
        approval: {
          ...original.approval,
          approved: decision.approval.approved,
        },
      };
    });
    return { ...message, parts };
  });
  return accepted ? merged : null;
}
