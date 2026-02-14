"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

const MOOD_CHECK_ROUTE = "/mind/emotion/control/daily-check?new=1";
const FINANCE_INTENT_TOKEN = "[INTENT:FINANCE_RECEIPT_CAPTURE]";

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    "Санхүүгийн баримтаа бүртгүүле",
    "Оюунсанаа төслийн танилцуулга",
    "Хоолны задаргаа хийж өгөөч",
    "Сэтгэлзүйн онолын мэдлэг унших",
  ];

  const goChat = () => {
    // Товч дармагц /chat/:id руу URL-ээ тааруулж өгнө (хуучин логик)
    window.history.pushState({}, "", `/chat/${chatId}`);
  };

  const sendText = (text: string) => {
    sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
    });
  };

  const handleAction = (label: string) => {
    // ✅ 1) Mood check: шууд тест рүү
    if (label === "Өнөөдрийн сэтгэл санаа хэр байна вэ?") {
      window.location.href = MOOD_CHECK_ROUTE; // router хэрэглэхгүйгээр, энгийн найдвартай үсрэлт
      return;
    }

    // ✅ 2) Finance: token-той явуулна
    if (label === "Санхүүгийн баримтаа бүртгүүле") {
      goChat();
      sendText(`${label}\n${FINANCE_INTENT_TOKEN}`);
      return;
    }

    // (Бусад 2-ыг одоохондоо өөрчлөхгүй)
    goChat();
    sendText(label);
  };

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2" data-testid="suggested-actions">
      {suggestedActions.map((label, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={label}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            suggestion={label}
            onClick={() => handleAction(label)}
          >
            {label}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false;
  return true;
});
