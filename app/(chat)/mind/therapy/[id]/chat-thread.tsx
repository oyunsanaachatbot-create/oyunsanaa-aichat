"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, Button, TextArea } from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";
import type { AppointmentSummary } from "@/lib/db/therapy";

type Message = {
  id: string;
  conversationId: string;
  senderEmail: string;
  senderRole: "client" | "psychologist";
  body: string;
  readAt: string | null;
  createdAt: string;
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function hhmm(t: string): string {
  return t.slice(0, 5);
}

function apptBadgeClass(status: string): string {
  if (status === "CONFIRMED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "CANCELLED") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function ChatThread({
  conversationId,
  counterpartEmail,
  myEmail,
  role,
  conversationStatus,
  appointment,
}: {
  conversationId: string;
  counterpartEmail: string;
  myEmail: string;
  role: "client" | "psychologist";
  conversationStatus: string;
  appointment: AppointmentSummary | null;
}) {
  const t = useT();
  const th = t.apps.therapy;
  const APPT_STATUS_LABEL: Record<string, string> = {
    CONFIRMED: th.statusConfirmed,
    PENDING: th.statusPending,
    CANCELLED: th.statusCancelled,
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(conversationStatus);
  const [togglingStatus, setTogglingStatus] = useState(false);
  // Has the booked session's end time passed? Seeded from the server so it is
  // correct on first paint, then re-checked by a timer so a page left open
  // locks itself the moment the appointment hour ends (no reload needed).
  const [windowEnded, setWindowEnded] = useState(
    appointment?.windowEnded ?? false
  );
  const seen = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const lowerMyEmail = myEmail.toLowerCase();

  const apptCancelled = appointment?.status === "CANCELLED";
  const sendable = status === "open" && !apptCancelled && !windowEnded;

  const merge = useCallback((incoming: Message[]) => {
    const fresh = incoming.filter((m) => !seen.current.has(m.id));
    if (fresh.length === 0) {
      return;
    }
    for (const m of fresh) {
      seen.current.add(m.id);
    }
    setMessages((prev) =>
      [...prev, ...fresh].sort((a, b) =>
        a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
      )
    );
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch(
      `/api/therapy/conversations/${conversationId}/messages`
    );
    if (res.ok) {
      const data = await res.json();
      merge(data.messages ?? []);
    }
  }, [conversationId, merge]);

  useEffect(() => {
    loadHistory();

    const es = new EventSource(`/api/therapy/stream/${conversationId}`);
    es.onmessage = (ev) => {
      try {
        merge([JSON.parse(ev.data) as Message]);
      } catch {
        // ignore malformed frame
      }
    };
    es.onopen = () => {
      loadHistory();
    };

    // Fallback poll: real-time fan-out (Postgres NOTIFY) is best-effort and a
    // very long Cyrillic message can be dropped, so reconcile history on an
    // interval too. `merge` de-dupes, so this never shows a message twice.
    const poll = setInterval(loadHistory, 15_000);

    return () => {
      es.close();
      clearInterval(poll);
    };
  }, [conversationId, loadHistory, merge]);

  // Flip to read-only exactly when the appointment's end time passes, so a chat
  // left open in the browser locks itself without a reload.
  useEffect(() => {
    if (windowEnded || !appointment?.endsAtEpoch) {
      return;
    }
    const msUntilEnd = appointment.endsAtEpoch * 1000 - Date.now();
    if (msUntilEnd <= 0) {
      setWindowEnded(true);
      return;
    }
    const t = setTimeout(() => setWindowEnded(true), msUntilEnd);
    return () => clearTimeout(t);
  }, [appointment?.endsAtEpoch, windowEnded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending || !sendable) {
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `/api/therapy/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        merge([data.message as Message]);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    const next = status === "open" ? "closed" : "open";
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/therapy/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
      }
    } finally {
      setTogglingStatus(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // After the session ends (or is cancelled) the toggle is meaningless — the
  // chat is permanently read-only — so only show it during a live session.
  const closeButton =
    role === "psychologist" && !apptCancelled && !windowEnded ? (
      <Button
        disabled={togglingStatus}
        onClick={toggleStatus}
        type="button"
        variant={status === "open" ? "ghost" : "primary"}
      >
        {status === "open" ? th.closeChatAction : th.reopenChatAction}
      </Button>
    ) : null;

  const frozenNotice = apptCancelled
    ? th.cancelledNotice
    : windowEnded
      ? th.endedNotice
      : status !== "open"
        ? th.closedByPsychNotice
        : null;

  return (
    <AppShell
      actions={closeButton}
      backHref="/mind/therapy"
      subtitle={role === "client" ? th.psychologistLabel : th.clientLabel}
      title={counterpartEmail}
      width="4xl"
    >
      {appointment && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">{th.appointmentLabel}</span>
          <span className="font-medium text-slate-800">
            {appointment.date} · {hhmm(appointment.startTime)}–
            {hhmm(appointment.endTime)}
          </span>
          <span
            className={`ml-auto rounded-full border px-2.5 py-0.5 font-semibold text-xs ${apptBadgeClass(
              appointment.status
            )}`}
          >
            {APPT_STATUS_LABEL[appointment.status] ?? appointment.status}
          </span>
        </div>
      )}

      <div className="flex h-[58vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <p className="py-8 text-center text-slate-400 text-sm">
              {th.emptyMessages}
            </p>
          )}
          {messages.map((m) => {
            const mine = m.senderEmail.toLowerCase() === lowerMyEmail;
            return (
              <div
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                key={m.id}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    mine
                      ? "bg-[#1F6FB2] text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <span
                    className={`mt-1 block text-[10px] ${
                      mine ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {timeLabel(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {frozenNotice ? (
          <p className="mt-3 rounded-[12px] bg-slate-100 px-3 py-2.5 text-center text-slate-500 text-sm">
            {frozenNotice}
          </p>
        ) : (
          <div className="mt-3 flex items-end gap-2">
            <TextArea
              className="min-h-[44px]"
              onChange={(e) => setDraft(e.target.value)}
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
        )}
      </div>
    </AppShell>
  );
}
