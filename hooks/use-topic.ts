// hooks/use-topic.ts
"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import type { TheoryKey } from "@/config/theory/static";

export type ChatTopic =
  | {
      kind: "theory";
      key: TheoryKey;
      title: string;
    }
  | null;

const initialTopic: ChatTopic = null;

export function useTopic() {
  const { data, mutate } = useSWR<ChatTopic>("chat-topic", null, {
    fallbackData: initialTopic,
  });

  const topic = useMemo(() => (data === undefined ? initialTopic : data), [data]);

  const setTopic = useCallback(
    (next: ChatTopic) => {
      mutate(next, { revalidate: false });
    },
    [mutate]
  );

  const clearTopic = useCallback(() => {
    mutate(null, { revalidate: false });
  }, [mutate]);

  return useMemo(() => ({ topic, setTopic, clearTopic }), [topic, setTopic, clearTopic]);
}
