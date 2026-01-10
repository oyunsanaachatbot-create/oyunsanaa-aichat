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

  // 1) Artifact нээгдсэн бол 4 товч харагдахгүй
  if (artifactVisible) return null;

  // 2) Зөвхөн New Chat ("/") дээр л харагдана
  const isNewChatPage = pathname === "/";
  if (!isNewChatPage) return null;

  const suggestedActions = [
    "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    "Санхүүгийн баримтаа бүртгүүлье",
    "Сэтгэлзүйн онолын мэдлэг унших",
    "Хоолны задаргаа хийж өгөөч",
  ];

  // ✅ Монгол товчийг дарсан ч, AI-д template шиг “artifact үүсгэ” prompt явуулна.
  const toPrompt = (label: string) => {
    if (label === "Сэтгэлзүйн онолын мэдлэг унших") {
      return [
        "Help me create a psychology theory guide as a TEXT ARTIFACT.",
        "Title: Сэтгэлзүйн онол – анхан шатны гарын авлага",
        "Language: Mongolian",
        "Requirements:",
        "- Start with a short 'Товч ойлголт' section (5-7 bullets).",
        "- Then provide a 'Агуулга' (Table of contents) with anchor links.",
        "- Create sections aligned to these menu topics: Сэтгэл санаа, Өөрийгөө ойлгох, Харилцаа, Зорилго/утга учир, Өөрийгөө хайрлах, Тогтвортой байдал.",
        "- Under each section: 1) тайлбар 2) яагаад чухал 3) өдөр тутмын 3 дадал 4) өөрөөсөө асуух 2 асуулт.",
        "- Keep the chat response very short (1-2 sentences). Put the detailed content ONLY in the artifact.",
      ].join("\n");
    }

    // Бусад товчнууд хэвийн chat асуулт байж болно
    return label;
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
            onClick={() => {
              window.history.pushState({}, "", `/chat/${chatId}`);

              sendMessage({
                role: "user",
                parts: [{ type: "text", text: toPrompt(label) }],
              });
            }}
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
