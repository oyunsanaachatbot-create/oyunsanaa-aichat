"use client";

import { useState } from "react";
import {
  AppShell,
  Button,
  EmptyState,
  Muted,
  SectionHeading,
} from "@/components/mind/app-shell";
import type { DirectConversation } from "@/lib/db/psychologist-chat";
import { useT } from "@/lib/i18n/provider";
import { displayParticipantName } from "@/lib/psychologist-chat/presentation";

export function OnlinePsychologistHome({
  conversations,
  role,
}: {
  conversations: DirectConversation[];
  role: "PATIENT" | "PSYCHOLOGIST";
}) {
  const t = useT();
  const th = t.apps.onlinePsychologist;
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPsychologist = role === "PSYCHOLOGIST";

  async function startChat() {
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/psychologist/conversations", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        conversationId?: string;
        error?: string;
      };
      if (!response.ok || !data.conversationId) {
        throw new Error(data.error || th.startChatFailed);
      }
      window.location.assign(
        `/mind/online-psychologist/${data.conversationId}`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : th.errorGeneric);
      setStarting(false);
    }
  }

  return (
    <AppShell backHref="/" subtitle={th.subtitle} title={th.title} width="4xl">
      {error && (
        <p className="mb-4 rounded-[12px] bg-red-50 px-3 py-2 text-red-600 text-sm">
          {error}
        </p>
      )}

      {isPsychologist ? (
        <section>
          <SectionHeading>{th.inboxHeading}</SectionHeading>
          {conversations.length === 0 ? (
            <EmptyState icon="💬">{th.noConversations}</EmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {conversations.map((conversation) => (
                <li
                  className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3"
                  key={conversation.id}
                >
                  <a
                    className="flex min-w-0 flex-1 items-center gap-3"
                    href={`/mind/online-psychologist/${conversation.id}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 font-semibold text-slate-500 text-sm uppercase">
                      {displayParticipantName(
                        conversation.patientName,
                        th.patientLabel
                      ).slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-800 text-sm">
                        {displayParticipantName(
                          conversation.patientName,
                          th.patientLabel
                        )}
                      </span>
                      <span className="block truncate text-slate-500 text-sm">
                        {conversation.lastBody || th.noConversations}
                      </span>
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-[#1F6FB2] px-1.5 py-0.5 font-semibold text-white text-xs">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : conversations.length > 0 ? (
        <section>
          <SectionHeading>{th.startHeading}</SectionHeading>
          <div className="mt-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1 text-sm">
                {displayParticipantName(
                  conversations[0].psychologistName,
                  th.psychologistLabel
                )}
              </span>
              <Button href={`/mind/online-psychologist/${conversations[0].id}`}>
                {th.openChatBtn}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <SectionHeading>{th.startHeading}</SectionHeading>
          <div className="mt-3 rounded-[14px] border border-slate-200 bg-white p-5">
            <p className="text-slate-600 text-sm">{th.startDescription}</p>
            <Button
              className="mt-4"
              disabled={starting}
              onClick={startChat}
              type="button"
            >
              {starting ? "..." : th.startChatBtn}
            </Button>
          </div>
        </section>
      )}

      <div className="mt-6">
        <Muted>{th.disclaimerNote}</Muted>
      </div>
    </AppShell>
  );
}
