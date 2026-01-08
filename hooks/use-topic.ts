"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

export type ChatTopic =
  | {
      kind: "theory";
      menuId: string;      // emotionControl гэх мэт
      title: string;       // Artifact title
      openedAt: number;    // announcement trigger
    }
  | null;

const initialTopic: ChatTopic = null;

export function useTopic() {
  const { data, mutate } = useSWR<ChatTopic>("chat-topic", null, {
    fallbackData: initialTopic,
  });

  const topic = useMemo(() => (data === undefined ? initialTopic : data), [data]);

  const setTopic = useCallback(
    (next: Omit<NonNullable<ChatTopic>, "openedAt">) => {
      mutate({ ...next, openedAt: Date.now() }, { revalidate: false });
    },
    [mutate]
  );

  const clearTopic = useCallback(() => {
    mutate(null, { revalidate: false });
  }, [mutate]);

  return useMemo(() => ({ topic, setTopic, clearTopic }), [topic, setTopic, clearTopic]);
}
