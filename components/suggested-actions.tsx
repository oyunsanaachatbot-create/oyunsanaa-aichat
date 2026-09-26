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

const FINANCE_RECEIPT_ROUTE = "/mind/life/finance-app?receipt=1";
const FOOD_PHOTO_ROUTE = "/mind/self-care/stress?meal=1";
const PSYCHOLOGY_TEST_ROUTE = "/mind/relations/tests";
const NOTES_ROUTE = "/mind/ebooks";

function PureSuggestedActions(_props: SuggestedActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const artifactVisible = useArtifactSelector((s) => s.isVisible);

  if (artifactVisible) return null;
  if (pathname !== "/") return null;

  // Keyed by a stable id so behaviour doesn't depend on the (translated) label.
  const suggestedActions: {
    id: "financeReceipt" | "foodPhoto" | "psychologyTest" | "note";
    label: string;
    href: string;
  }[] = [
    {
      id: "financeReceipt",
      label: t.suggestions.financeReceipt,
      href: FINANCE_RECEIPT_ROUTE,
    },
    {
      id: "foodPhoto",
      label: t.suggestions.foodPhoto,
      href: FOOD_PHOTO_ROUTE,
    },
    {
      id: "psychologyTest",
      label: t.suggestions.psychologyTest,
      href: PSYCHOLOGY_TEST_ROUTE,
    },
    { id: "note", label: t.suggestions.note, href: NOTES_ROUTE },
  ];

  const handleClick = (action: (typeof suggestedActions)[number]) => {
    router.push(action.href);
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
            className="h-auto w-full whitespace-normal border border-[#1F6FB2]/20 bg-[#1F6FB2]/10 p-3 text-left text-[#1F6FB2] hover:border-[#1F6FB2]/30 hover:bg-[#1F6FB2]/15"
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
