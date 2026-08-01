"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, Button, Muted, TextArea } from "@/components/mind/app-shell";
import type {
  DirectChatRole,
  DirectMessage,
} from "@/lib/db/psychologist-chat";
import { useT } from "@/lib/i18n/provider";
import { displayParticipantName } from "@/lib/psychologist-chat/presentation";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OnlinePsychologistThread({
  conversationId,
  counterpartName,
  myId,
  role,
}: {
  conversationId: string;
  counterpartName: string | null;
  myId: string;
  role: DirectChatRole;
}) {
  const t = useT();
  const th = t.apps.onlinePsychologist;
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const merge = useCallback((incoming: DirectMessage[]) => {
    const fresh = incoming.filter((message) => !seen.current.has(message.id));
    if (!fresh.length) return;
    for (const message of fresh) seen.current.add(message.id);
    setMessages((previous) =>
      [...previous, ...fresh].sort((a, b) =>
        a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
      )
    );
  }, []);

  const loadHistory = useCallback(async () => {
    const response = await fetch(
      `/api/psychologist/conversations/${conversationId}/messages`
    );
    if (!response.ok) return;
    const data = (await response.json()) as { messages?: DirectMessage[] };
    merge(data.messages ?? []);
  }, [conversationId, merge]);

  useEffect(() => {
    loadHistory();
    const eventSource = new EventSource(
      `/api/psychologist/stream/${conversationId}`
    );
    eventSource.onmessage = (event) => {
      try {
        merge([JSON.parse(event.data) as DirectMessage]);
      } catch {
        // Ignore malformed realtime frames; polling will reconcile history.
      }
    };
    eventSource.onopen = loadHistory;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadHistory();
    };
    const poll = window.setInterval(loadHistory, 5000);
    window.addEventListener("focus", loadHistory);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      eventSource.close();
      window.clearInterval(poll);
      window.removeEventListener("focus", loadHistory);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [conversationId, loadHistory, merge]);

  const latestMessageId = messages.at(-1)?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the latest message after the list changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latestMessageId]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/psychologist/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        message?: DirectMessage;
        error?: string;
      };
      if (!response.ok || !data.message) {
        throw new Error(data.error || th.errorGeneric);
      }
      merge([data.message]);
      setDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : th.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  return (
    <AppShell
      backHref="/mind/online-psychologist"
      subtitle={role === "patient" ? th.psychologistLabel : th.patientLabel}
      title={displayParticipantName(
        counterpartName,
        role === "patient" ? th.psychologistLabel : th.patientLabel
      )}
      width="4xl"
    >
      {error && (
        <p className="mb-3 rounded-[12px] bg-red-50 px-3 py-2 text-red-600 text-sm">
          {error}
        </p>
      )}

      <div className="flex h-[62vh] flex-col rounded-[14px] border border-slate-200 bg-white p-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <p className="py-8 text-center text-slate-400 text-sm">
              {th.emptyMessages}
            </p>
          )}
          {messages.map((message) => {
            const mine = message.senderId === myId;
            return (
              <div
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine
                      ? "bg-[#1F6FB2] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.body}
                  </p>
                  <span
                    className={`mt-1 block text-[10px] ${
                      mine ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {timeLabel(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex items-end gap-2">
          <TextArea
            className="min-h-[44px]"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={th.messagePlaceholder}
            rows={1}
            value={draft}
          />
          <Button
            disabled={sending || !draft.trim()}
            onClick={send}
            type="button"
          >
            {t.common.send}
          </Button>
        </div>
      </div>

      <Muted className="mt-4">{th.disclaimerNote}</Muted>
    </AppShell>
  );
}
