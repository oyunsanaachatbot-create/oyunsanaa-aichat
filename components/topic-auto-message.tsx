"use client";

import { useEffect, useRef } from "react";
import { useTopic } from "@/hooks/use-topic";
import type { ChatMessage } from "@/lib/types";

export function TopicAutoMessage({
  setMessages,
}: {
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
}) {
  const { topic } = useTopic();
  const lastOpenedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!topic) return;
    if (lastOpenedAt.current === topic.openedAt) return;

    lastOpenedAt.current = topic.openedAt;

    const text =
      `Та одоо **${topic.title}** уншиж байна.\n` +
      `Энэ сэдэвтэй холбоотой асуух зүйл байвал эндээс асуугаарай.`;

    setMessages((prev) => {
      // давхар оруулахгүй хамгаалалт
      const already = prev.slice(-3).some((m) =>
        m.role === "assistant" &&
        m.parts?.some((p: any) => p.type === "text" && String(p.text).includes(topic.title))
      );
      if (already) return prev;

      return [
        ...prev,
        {
          id: `topic-${topic.openedAt}`,
          role: "assistant",
          parts: [{ type: "text", text }],
        } as any,
      ];
    });
  }, [topic, setMessages]);

  return null;
}
