"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ChatMessage } from "@/lib/types";
import type { VisibilityType } from "./visibility-selector";
import { Suggestion } from "./elements/suggestion";
import { useArtifactSelector } from "@/hooks/use-artifact";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

const MOOD_CHECK_ROUTE = "/mind/emotion/control/daily-check?new=1";

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const artifactVisible = useArtifactSelector((s) => s.isVisible);

  if (artifactVisible) return null;
  if (pathname !== "/") return null;

  const suggestedActions = [
    "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    "Санхүүгийн баримтаа бүртгүүлье",
    "Оюунсанаа төслийн танилцуулга",
    "Хоолны задаргаа хийж өгөөч",
  ];

  const handleClick = (label: string) => {
    // 1) Mood check: шууд route руу
    if (label === "Өнөөдрийн сэтгэл санаа хэр байна вэ?") {
      router.push(MOOD_CHECK_ROUTE);
      return;
    }

    // 2) Бусад бүгд: чат руу энгийн текстээр явуулна (token байхгүй)
    window.history.pushState({}, "", `/chat/${chatId}`);
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: label }],
    });
  };

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2" data-testid="suggested-actions">
      {suggestedActions.map((label, index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left border border-[#1F6FB2]/20 bg-[#1F6FB2]/10 text-[#1F6FB2] hover:bg-[#1F6FB2]/15 hover:border-[#1F6FB2]/30"
            suggestion={label}
            onClick={() => handleClick(label)}
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
