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

type Action = {
  label: string;   // UI дээр харагдах текст (Монгол)
  prompt: string;  // AI руу явуулах мессеж (илүү тодорхой)
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const pathname = usePathname();
  const artifactVisible = useArtifactSelector((s) => s.isVisible);

  // 1) Artifact нээгдсэн үед 4 товч харагдахгүй
  if (artifactVisible) return null;

  // 2) Зөвхөн New Chat ("/") дээр л харагдана
  const isNewChatPage = pathname === "/";
  if (!isNewChatPage) return null;

  const actions: Action[] = [
    {
      label: "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
      prompt: "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    },
    {
      label: "Санхүүгийн баримтаа бүртгүүлье",
      prompt: "Санхүүгийн баримтаа бүртгүүлье.",
    },

    // ✅ Энэ нь ARTIFACT үүсгүүлэх тусгай prompt
    {
      label: "Сэтгэлзүйн онолын мэдлэг унших",
      prompt: `
TEXT ARTIFACT үүсгээд Монгол хэлээр “Сэтгэлзүйн онол — анхан шатны гарын авлага” бич.

Зорилго:
- Энэ бол “хажуу меню”-ийн 6 сэдвийг товч танилцуулж, “дэлгэрүүлж судлаарай” гэсэн утгатай эхлэлтэй байна.
- Дараа нь “өөр олон сэдэв байдаг, өөрт таарснаа сонгоод уншаарай” гэдэг чиглүүлэгтэй байна.
- Дараах бүтэцтэй бай:
  1) Товч ойлголт (3–6 bullet)
  2) Гарчиг/Агуулга (Table of Contents) — хэсэг бүр anchor-той (#) байж болно
  3) Хэсгүүд: 
     - Сэтгэл санаа (emotion basics)
     - Өөрийгөө ойлгох (self-awareness)
     - Харилцаа (relationships & communication)
     - Зорилго, утга учир (meaning & motivation)
     - Өөрийгөө хайрлах (self-compassion)
     - Тогтвортой байдал (habits, resilience)
  4) Хэсэг бүрт: Тодорхойлолт + Яагаад чухал + Өдөр тутмын 2 практик + Өөрөөсөө асуух 2 асуулт.

Анхаарах зүйл:
- Хэт урт биш, уншихад амархан.
- Хүний нэр/эмчилгээний зөвлөгөө биш, боловсролын мэдээлэл маягаар бич.
- Зөвхөн artifact-ийн контентоо буцаа.
      `.trim(),
    },

    {
      label: "Хоолны задаргаа хийж өгөөч",
      prompt: "Хоолны задаргаа хийж өгөөч.",
    },
  ];

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {actions.map((a, index) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left border border-[#1F6FB2]/20 bg-[#1F6FB2]/10 text-[#1F6FB2] hover:bg-[#1F6FB2]/15 hover:border-[#1F6FB2]/30"
            suggestion={a.label}
            onClick={() => {
              // New Chat дээр товч дарахад chat route үүсгэх
              window.history.pushState({}, "", `/chat/${chatId}`);

              // ✅ AI руу явуулах нь prompt
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: a.prompt }],
              });
            }}
          >
            {a.label}
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
