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
  const isNewChatPage = pathname === "/";
  if (!isNewChatPage) return null;

  // 🌍 Language detection (MN vs EN) — хамгийн энгийн хувилбар
  const isMn =
    typeof navigator !== "undefined" &&
    (navigator.language?.toLowerCase().startsWith("mn") ?? false);

  // ✅ Зөвхөн 3 дахь товчийг "artifact trigger prompt"-той болгоно
  const suggestedActions: Array<{
    id: "mood" | "finance" | "psy" | "food";
    label: string;
    prompt: string;
  }> = [
    {
      id: "mood",
      label: "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
      prompt: "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    },
    {
      id: "finance",
      label: "Санхүүгийн баримтаа бүртгүүлье",
      prompt: "Санхүүгийн баримтаа бүртгүүлье",
    },
    {
      id: "psy",
      label: "Сэтгэлзүйн онолын мэдлэг унших",
      prompt: isMn
        ? [
            "Help me create a psychology theory guide as a TEXT ARTIFACT.",
            "Title: Сэтгэлзүйн онолын мэдлэг",
            "Language: Mongolian",
            "",
            "Requirements:",
            "- Start with a short 'Товч ойлголт' section (3-6 bullets).",
            "- Then provide a Table of Contents with anchor links.",
            "- Then create sections (with clear headings) for:",
            "  1) Сэтгэл түгшүүр (Anxiety)",
            "  2) Паник (Panic)",
            "  3) Депресс (Depression)",
            "  4) Хавсралтын онол (Attachment theory)",
            "  5) CBT үндэс (automatic thoughts, cognitive distortions)",
            "  6) Grounding & амьсгалын техник",
            "- Under each section: definition, why it happens, how it shows, 3 practical tips, and 2 self-questions.",
            "",
            "Important: Return ONLY the artifact content.",
          ].join("\n")
        : [
            "Help me create a psychology theory guide as a TEXT ARTIFACT.",
            "Title: Psychology Theory Guide",
            "Language: English",
            "",
            "Requirements:",
            "- Start with a short 'Key ideas' section (3-6 bullets).",
            "- Then provide a Table of Contents with anchor links.",
            "- Then create sections for: Anxiety, Panic, Depression, Attachment theory, CBT basics, Grounding & breathing.",
            "- Each section: definition, why it happens, how it shows up, 3 practical tips, 2 self-questions.",
            "",
            "Important: Return ONLY the artifact content.",
          ].join("\n"),
    },
    {
      id: "food",
      label: "Хоолны задаргаа хийж өгөөч",
      prompt: "Хоолны задаргаа хийж өгөөч",
    },
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
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
            onClick={() => {
              // ✅ New Chat дээр товч дарахад chat route үүсгэх
              window.history.pushState({}, "", `/chat/${chatId}`);

              // ✅ 3 дахь товч (psy) дээр дархад help-me prompt явуулна
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: action.prompt }],
              });
            }}
          >
            {action.label}
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
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    return true;
  }
);
