"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo, useEffect } from "react";

import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";

import { useDataStream } from "./data-stream-provider";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

// ✅ Хүснэгт гаргах компонент
import FinanceReceiptCard from "@/app/(chat)/components/finance-receipt-card";

type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModelId: string;
};

function PureMessages({
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({ status });

  useDataStream();

  // ✅ submitted үед доош нь 1 удаа аваачна (хуучин шиг)
  useEffect(() => {
    if (status === "submitted") {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        container?.scrollTo({ top: container.scrollHeight });
      });
    }
  }, [status, messagesContainerRef]);

  return (
    <div className="relative flex-1">
      <div
        className="absolute inset-0 touch-pan-y overflow-y-auto"
        ref={messagesContainerRef}
        style={{ overflowAnchor: "none" }}
      >
        <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {messages.length === 0 && <Greeting />}

          {messages.map((m, index) => {
            // ✅ assistant message-ийн text-ийг авна
            const textPart = m.parts?.find((p: any) => p?.type === "text") as any;
            const text = String(textPart?.text ?? "");

            // ✅ FINANCE_JSON байвал: PreviewMessage-г алгасаад хүснэгт гаргана
            if (m.role === "assistant" && text.includes("<FINANCE_JSON>")) {
              const match = text.match(/<FINANCE_JSON>([\s\S]*?)<\/FINANCE_JSON>/);

              if (match?.[1]) {
                try {
                  const data = JSON.parse(match[1].trim());

                  // human хэсгийг цэвэрлээд хүснэгтэнд дамжуулна
                  const humanText = text
                    .replace(match[0], "")
                    .replace(/<\/?FINANCE_HUMAN>/g, "")
                    .trim();

                  return (
                    <FinanceReceiptCard
                      key={m.id}
                      data={data}
                      originalText={humanText}
                    />
                  );
                } catch (e) {
                  console.error("Finance JSON parse error:", e);
                  // parse fail -> fallback хэвийн мессеж
                }
              }
            }

            return (
              <PreviewMessage
                addToolApprovalResponse={addToolApprovalResponse}
                chatId={chatId}
                isLoading={status === "streaming" && messages.length - 1 === index}
                isReadonly={isReadonly}
                key={m.id}
                message={m}
                regenerate={regenerate}
                requiresScrollPadding={hasSentMessage && index === messages.length - 1}
                setMessages={setMessages}
                vote={
                  votes
                    ? votes.find((vote) => vote.messageId === m.id)
                    : undefined
                }
              />
            );
          })}

          {status === "submitted" &&
            !messages.some((msg) =>
              msg.parts?.some(
                (part: any) => "state" in part && part.state === "approval-responded"
              )
            ) && <ThinkingMessage />}

          <div className="min-h-[24px] min-w-[24px] shrink-0" ref={messagesEndRef} />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={`-translate-x-1/2 absolute bottom-4 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${
          isAtBottom
            ? "pointer-events-none scale-0 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
        onClick={() => scrollToBottom("smooth")}
        type="button"
      >
        <ArrowDownIcon className="size-4" />
      </button>
    </div>
  );
}

export const Messages = memo(PureMessages, (prev, next) => {
  if (prev.isArtifactVisible && next.isArtifactVisible) return true;

  if (prev.status !== next.status) return false;
  if (prev.selectedModelId !== next.selectedModelId) return false;

  if (prev.messages === next.messages) return false;
  if (prev.messages.length !== next.messages.length) return false;

  if (!equal(prev.messages, next.messages)) return false;
  if (!equal(prev.votes, next.votes)) return false;

  return true;
});
