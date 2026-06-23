"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ChatMessage } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";
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
  const t = useT();
  const artifactVisible = useArtifactSelector((s) => s.isVisible);

  if (artifactVisible) return null;
  if (pathname !== "/") return null;

  // Keyed by a stable id so behaviour doesn't depend on the (translated) label.
  const suggestedActions: { id: "moodCheck" | "finance" | "intro" | "mealBreakdown"; label: string }[] = [
    { id: "moodCheck", label: t.suggestions.moodCheck },
    { id: "finance", label: t.suggestions.finance },
    { id: "intro", label: t.suggestions.intro },
    { id: "mealBreakdown", label: t.suggestions.mealBreakdown },
  ];

  const handleClick = (action: (typeof suggestedActions)[number]) => {
    // 1) Mood check: route directly
    if (action.id === "moodCheck") {
      router.push(MOOD_CHECK_ROUTE);
      return;
    }

    // 2) Others: enter the chat route and send the (localized) text
    window.history.pushState({}, "", `/chat/${chatId}`);
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: action.label }],
    });
  };

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2" data-testid="suggested-actions">
      {suggestedActions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left border border-[#1F6FB2]/20 bg-[#1F6FB2]/10 text-[#1F6FB2] hover:bg-[#1F6FB2]/15 hover:border-[#1F6FB2]/30"
            suggestion={action.label}
            onClick={() => handleClick(action)}
          >
            {action.label}
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
