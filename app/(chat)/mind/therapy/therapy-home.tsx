"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  Muted,
  SectionHeading,
} from "@/components/mind/app-shell";
import { isAdminRole } from "@/lib/auth/roles";
import { useT } from "@/lib/i18n/provider";
import type {
  ConversationListItem,
  SchedulingRole,
  StartableAppointment,
} from "@/lib/db/therapy";

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

export function TherapyHome({
  conversations,
  appointments,
  role,
}: {
  conversations: ConversationListItem[];
  appointments: StartableAppointment[];
  role: SchedulingRole | null;
}) {
  const t = useT();
  const th = t.apps.therapy;
  const APPT_STATUS_LABEL: Record<string, string> = {
    CONFIRMED: th.statusConfirmed,
    PENDING: th.statusPending,
    CANCELLED: th.statusCancelled,
  };
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPsychologist = role === "PSYCHOLOGIST" || isAdminRole(role);

  // Local open/closed state per conversation so the psychologist can enable or
  // disable a chat straight from this list (their profile view) — no automatic
  // time-window locking.
  const [statusMap, setStatusMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(conversations.map((c) => [c.id, c.status]))
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function toggleChat(id: string) {
    const current = statusMap[id] ?? "open";
    const next = current === "open" ? "closed" : "open";
    setTogglingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/therapy/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? th.statusChangeFailed);
      }
      setStatusMap((prev) => ({ ...prev, [id]: next }));
    } catch (e: any) {
      setError(e?.message ?? th.errorGeneric);
    } finally {
      setTogglingId(null);
    }
  }

  // Appointments that don't yet have a conversation.
  const existing = new Set(
    conversations.map((c) => c.appointmentId).filter(Boolean) as string[]
  );
  const startable = appointments.filter((a) => !existing.has(a.appointmentId));

  async function startChat(appointmentId: string) {
    setError(null);
    setStartingId(appointmentId);
    try {
      const res = await fetch("/api/therapy/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? th.startChatFailed);
      }
      router.push(`/mind/therapy/${data.conversationId}`);
    } catch (e: any) {
      setError(e?.message ?? th.errorGeneric);
      setStartingId(null);
    }
  }

  return (
    <AppShell backHref="/" subtitle={th.subtitle} title={th.title} width="4xl">
      {role === null && (
        <EmptyState icon="🔗">
          <span
            // biome-ignore lint/security/noDangerouslySetInnerHtml: dictionary-controlled string with a literal <strong> tag, no user input.
            dangerouslySetInnerHTML={{ __html: th.needBookingNoticeHtml }}
          />
        </EmptyState>
      )}

      {error && (
        <p className="mb-4 rounded-[12px] bg-red-50 px-3 py-2 text-red-600 text-sm">
          {error}
        </p>
      )}

      {conversations.length > 0 && (
        <section className="mb-8">
          <SectionHeading>{th.activeChatsHeading}</SectionHeading>
          <ul className="mt-3 space-y-2">
            {conversations.map((c) => {
              const chatStatus = statusMap[c.id] ?? c.status;
              const ended = c.apptWindowEnded === true;
              // A finished (or cancelled) session is permanently read-only, so
              // the manual toggle no longer applies — show it as closed instead.
              const closed = chatStatus !== "open" || ended;
              return (
                <li
                  className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm"
                  key={c.id}
                >
                  <a
                    className="flex min-w-0 flex-1 items-center gap-3"
                    href={`/mind/therapy/${c.id}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 font-semibold text-slate-500 text-sm uppercase">
                      {c.counterpartEmail.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-800 text-sm">
                        {c.counterpartEmail}
                      </span>
                      <span className="block truncate text-slate-500 text-xs">
                        {c.apptDate
                          ? `${c.apptDate}${c.apptStartTime ? ` · ${hhmm(c.apptStartTime)}` : ""}`
                          : ""}
                        {c.lastBody
                          ? `${c.apptDate ? " — " : ""}${c.lastBody}`
                          : c.apptDate
                            ? ""
                            : th.noChatStarted}
                      </span>
                    </span>
                    {c.apptStatus && (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 font-semibold text-[10px] ${apptBadgeClass(
                          c.apptStatus
                        )}`}
                      >
                        {APPT_STATUS_LABEL[c.apptStatus] ?? c.apptStatus}
                      </span>
                    )}
                    {c.unreadCount > 0 && (
                      <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-[#1F6FB2] px-1.5 py-0.5 font-semibold text-[11px] text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </a>

                  {/* Chat enabled/disabled — visible to both, controllable by psychologist */}
                  {closed && (
                    <span className="shrink-0 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 font-semibold text-[10px] text-slate-500">
                      {ended ? th.ended : th.closed}
                    </span>
                  )}
                  {/* Once the session has ended the toggle is meaningless — the
                      chat is permanently read-only — so only the psychologist of
                      a still-live session sees it. */}
                  {isPsychologist && !ended && (
                    <Button
                      className="shrink-0 px-3 py-1.5 text-xs"
                      disabled={togglingId === c.id}
                      onClick={() => toggleChat(c.id)}
                      type="button"
                      variant={closed ? "primary" : "ghost"}
                    >
                      {togglingId === c.id
                        ? "..."
                        : closed
                          ? th.openChatBtn
                          : th.closeChatBtn}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {startable.length > 0 && (
        <section>
          <SectionHeading>{th.startFromBookingHeading}</SectionHeading>
          <ul className="mt-3 space-y-2">
            {startable.map((a) => (
              <li
                className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3"
                key={a.appointmentId}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800 text-sm">
                    {a.counterpartName || a.counterpartEmail}
                  </span>
                  <span className="block text-slate-500 text-xs">
                    {a.date} · {hhmm(a.startTime)}–{hhmm(a.endTime)}
                  </span>
                </span>
                <Badge>{th.online}</Badge>
                <Button
                  disabled={startingId === a.appointmentId}
                  onClick={() => startChat(a.appointmentId)}
                  type="button"
                >
                  {startingId === a.appointmentId ? "..." : th.startChatBtn}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {role !== null &&
        conversations.length === 0 &&
        startable.length === 0 && (
          <EmptyState icon="💬">
            {isPsychologist ? th.emptyPsychologist : th.emptyClient}
          </EmptyState>
        )}

      {!isPsychologist && (
        <div className="mt-4">
          <a
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#1F6FB2] px-4 py-3 font-semibold text-sm text-white transition hover:bg-[#1a5d96]"
            href="https://oyunsanaa.com/book"
            rel="noopener noreferrer"
            target="_blank"
          >
            {th.bookBtn}
          </a>
        </div>
      )}

      <div className="mt-6">
        <Muted>{th.disclaimerNote}</Muted>
      </div>
    </AppShell>
  );
}
