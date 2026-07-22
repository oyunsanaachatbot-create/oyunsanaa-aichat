"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo, useEffect } from "react";

import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";

import { useDataStream } from "./data-stream-provider";
import FoodNutritionCard, {
  type FoodNutritionData,
} from "@/app/(chat)/components/food-nutrition-card";
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

type MessageRowProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  isLoading: boolean;
  isReadonly: boolean;
  message: ChatMessage;
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  requiresScrollPadding: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  vote: Vote | undefined;
};

const FOOD_JSON_PATTERN = /<FOOD_JSON>([\s\S]*?)<\/FOOD_JSON>/i;
const FOOD_LEGACY_HEADER_PATTERN = /ойролцоо\s+шим\s+тэжээлийн\s+задаргаа/i;
const FOOD_LEGACY_HEADING_PATTERN = /^\s*([^:\n]{2,40}):\s*$/gm;
const FOOD_LEGACY_IGNORE_HEADING_PATTERN = /шим\s+тэжээлийн|зорилтот|өдрийн/i;
const FINANCE_JSON_PATTERN = /<FINANCE_JSON>([\s\S]*?)<\/FINANCE_JSON>/;

function parseLegacyFoodPayload(text: string): FoodNutritionData | null {
  if (!FOOD_LEGACY_HEADER_PATTERN.test(text)) return null;

  const values = (pattern: RegExp) =>
    [...text.matchAll(pattern)]
      .map((match) => Number(match[1].replace(",", ".")))
      .filter((value) => Number.isFinite(value));
  const sum = (items: number[]) =>
    items.reduce((total, value) => total + value, 0);

  const calories = values(/(?:илчлэг|калори)\s*:\s*([\d.,]+)/gi);
  const protein = values(/уураг\s*:\s*([\d.,]+)/gi);
  const fat = values(/өөх\s+тос\s*:\s*([\d.,]+)/gi);
  const carbs = values(/нүүрс\s+ус\s*:\s*([\d.,]+)/gi);
  const fibre = values(/эслэг\s*:\s*([\d.,]+)/gi);
  const sugar = values(/сахар\s*:\s*([\d.,]+)/gi);

  // This fallback keeps older food-photo messages actionable after deployment.
  if (
    calories.length < 2 ||
    protein.length < 2 ||
    fat.length < 2 ||
    carbs.length < 2 ||
    fibre.length < 2
  ) {
    return null;
  }

  const headings = [...text.matchAll(FOOD_LEGACY_HEADING_PATTERN)]
    .map((match) => match[1].trim())
    .filter((heading) => !FOOD_LEGACY_IGNORE_HEADING_PATTERN.test(heading));
  const name = headings.slice(0, 2).join(", ") || "Зурган дээрх хоол";

  return {
    name,
    calories: sum(calories),
    protein_g: sum(protein),
    good_carbs_g: sum(carbs),
    bad_carbs_g: 0,
    fat_g: sum(fat),
    fibre_g: sum(fibre),
    sugar_g: sugar.length ? sum(sugar) : 0,
    nutrition_score: 0,
  };
}

function parseFoodPayload(text: string): FoodNutritionData | null {
  const match = text.match(FOOD_JSON_PATTERN);
  if (!match?.[1]) return parseLegacyFoodPayload(text);

  try {
    const raw = JSON.parse(match[1].trim()) as Record<string, unknown>;
    const number = (key: string, fallbackKey?: string) => {
      const value = raw[key] ?? (fallbackKey ? raw[fallbackKey] : undefined);
      return typeof value === "number" && Number.isFinite(value) ? value : null;
    };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const calories = number("calories");
    const protein = number("protein_g", "proteinG");
    const goodCarbs = number("good_carbs_g", "goodCarbsG");
    const badCarbs = number("bad_carbs_g", "badCarbsG");
    const fat = number("fat_g", "fatG");
    const fibre = number("fibre_g", "fiberG");
    const sugar = number("sugar_g", "sugarG");
    const score = number("nutrition_score", "nutritionScore");

    // No add action for an unrecognized meal or incomplete model payload.
    if (
      !name ||
      name.toLowerCase().includes("тодорхойгүй") ||
      calories === null ||
      calories <= 0 ||
      protein === null ||
      goodCarbs === null ||
      badCarbs === null ||
      fat === null ||
      fibre === null ||
      sugar === null ||
      score === null
    ) {
      return null;
    }

    return {
      name,
      portion: typeof raw.portion === "string" ? raw.portion : undefined,
      calories,
      protein_g: protein,
      good_carbs_g: goodCarbs,
      bad_carbs_g: badCarbs,
      fat_g: fat,
      fibre_g: fibre,
      sugar_g: sugar,
      nutrition_score: score,
    };
  } catch {
    return null;
  }
}

// FINANCE_JSON detection lives behind the same memo bailout as PreviewMessage,
// so it only re-runs for the message that actually changed, not the whole list.
function PureMessageRow({
  addToolApprovalResponse,
  chatId,
  isLoading,
  isReadonly,
  message: m,
  regenerate,
  requiresScrollPadding,
  setMessages,
  vote,
}: MessageRowProps) {
  const textPart = m.parts?.find((p: any) => p?.type === "text") as any;
  const text = String(textPart?.text ?? "");

  if (m.role === "assistant") {
    const foodData = parseFoodPayload(text);
    if (foodData) {
      return (
        <FoodNutritionCard
          data={foodData}
          isReadonly={isReadonly}
          messageId={m.id}
          originalText={text}
        />
      );
    }
  }

  // ✅ FINANCE_JSON байвал: PreviewMessage-г алгасаад хүснэгт гаргана
  if (m.role === "assistant" && text.includes("<FINANCE_JSON>")) {
    const match = text.match(FINANCE_JSON_PATTERN);

    if (match?.[1]) {
      try {
        const data = JSON.parse(match[1].trim());

        // human хэсгийг цэвэрлээд хүснэгтэнд дамжуулна
        const humanText = text
          .replace(match[0], "")
          .replace(/<\/?FINANCE_HUMAN>/g, "")
          .trim();

        return <FinanceReceiptCard data={data} originalText={humanText} />;
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
      isLoading={isLoading}
      isReadonly={isReadonly}
      message={m}
      regenerate={regenerate}
      requiresScrollPadding={requiresScrollPadding}
      setMessages={setMessages}
      vote={vote}
    />
  );
}

const MessageRow = memo(PureMessageRow, (prevProps, nextProps) => {
  // ✅ STREAM үед заавал re-render зөвшөөрнө
  if (prevProps.isLoading || nextProps.isLoading) {
    return false;
  }

  if (
    prevProps.message.id === nextProps.message.id &&
    prevProps.requiresScrollPadding === nextProps.requiresScrollPadding &&
    equal(prevProps.message.parts, nextProps.message.parts) &&
    equal(prevProps.vote, nextProps.vote)
  ) {
    return true;
  }

  return false;
});

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

          {messages.map((m, index) => (
            <MessageRow
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
                votes ? votes.find((vote) => vote.messageId === m.id) : undefined
              }
            />
          ))}

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

  // ⚠️ Stream идэвхтэй үед ЗААВАЛ re-render хийнэ. useChat-ийн
  // useSyncExternalStore snapshot нь render бүрт хамгийн СҮҮЛИЙН утгыг
  // буцаадаг тул memo bailout болох бүрд memoizedProps шинэчлэгдэж,
  // prev/next хоёулаа адилхан "хамгийн сүүлийн" агуулгатай болдог.
  // Ингэснээр доорх deep-equal үргэлж true буцааж, стрийм дуустал
  // НЭГ Ч удаа re-render хийхгүй → хариулт "гэнэт бүхэлдээ" гарч
  // ирдэг байсан (typewriter огт ажиллахгүй).
  if (prev.status === "streaming" || next.status === "streaming") {
    return false;
  }
  if (prev.status === "submitted" || next.status === "submitted") {
    return false;
  }

  if (prev.status !== next.status) return false;
  if (prev.selectedModelId !== next.selectedModelId) return false;

  if (prev.messages === next.messages) return false;
  if (prev.messages.length !== next.messages.length) return false;

  if (!equal(prev.messages, next.messages)) return false;
  if (!equal(prev.votes, next.votes)) return false;

  return true;
});
