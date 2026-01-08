"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";
import { usePathname } from "next/navigation";
import { useArtifactSelector } from "@/hooks/use-artifact";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const pathname = usePathname();
  const artifactVisible = useArtifactSelector((s) => s.isVisible);

  // ✅ 1) Artifact нээгдсэн бол 4 товч огт харагдахгүй
  if (artifactVisible) return null;

  // ✅ 2) 4 товч зөвхөн New Chat (home "/") дээр л харагдана
  // (Танай chatId UUID тул chatId-аар биш pathname-аар ялгана)
  const isNewChatPage = pathname === "/";
  if (!isNewChatPage) return null;

  const suggestedActions = [
    "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    "Санхүүгийн баримтаа бүртгүүлье",
    "Сэтгэлзүйн онолын мэдлэг унших",
    "Хоолны задаргаа хийж өгөөч",
  ];

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2" data-testid="suggested-actions">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          key={suggestedAction}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left border border-[#1F6FB2]/20 bg-[#1F6FB2]/10 text-[#1F6FB2] hover:bg-[#1F6FB2]/15 hover:border-[#1F6FB2]/30"
            suggestion={suggestedAction}
            onClick={(suggestion) => {
              // ✅ New Chat дээр товч дарахад chat route үүсгэх
              // (танай template энэ байдлаар ажиллаж байгаа)
              window.history.pushState({}, "", `/chat/${chatId}`);

              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false;
    return true;
  }
);
