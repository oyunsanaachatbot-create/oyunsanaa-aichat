"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ChatMessage } from "@/lib/types";
import type { VisibilityType } from "./visibility-selector";
import { Suggestion } from "./elements/suggestion";
import { useArtifact, useArtifactSelector } from "@/hooks/use-artifact";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

// ✅ Түр богино бэлэн текст (дараа нь уртасгаж болно)
const THEORY_TEXT = `# Сэтгэлзүйн онол – товч

- Сэтгэл санаа, бодол, зан үйл 3 нь хоорондоо холбоотой.
- Сэтгэл хөдлөл хурдан, сэтгэл санаа удаан үргэлжилнэ.
- Өдөр тутам: унтах, хөдөлгөөн, харилцаа хамгийн хүчтэй нөлөөлнө.

💬 Эндээс аль хэсэг нь танд яг тохирч байна? Тайлбарлаад асуугаарай.`;

const FINANCE_INTENT_TOKEN = "[INTENT:FINANCE_RECEIPT_CAPTURE]";

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const artifactVisible = useArtifactSelector((s) => s.isVisible);
  const { setArtifact } = useArtifact();

  // 1) Artifact нээгдсэн бол 4 товч харагдахгүй
  if (artifactVisible) return null;

  // 2) Зөвхөн New Chat ("/") дээр л харагдана
  if (pathname !== "/") return null;

  // ⚠️ Энэ route-оо өөрийнхөө mood/daily-check page route-оор солиорой
  // Ж: "/mind/emotion/feel-now" эсвэл "/mind/life/daily-check" гэх мэт
const MOOD_CHECK_ROUTE = "/mind/emotion/control/daily-check?new=1";

  const suggestedActions = [
    "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    "Санхүүгийн баримтаа бүртгүүле",
    "Оюунсанаа төслийн танилцуулга",
    "Хоолны задаргаа хийж өгөөч",
    "Сэтгэлзүйн онолын мэдлэг унших",
  ];

  const sendText = (text: string) => {
    sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
    });
  };

  const handleClick = (label: string) => {
    // ✅ 1) Mood check: шууд practice page руу үсэрнэ
    if (label === "Өнөөдрийн сэтгэл санаа хэр байна вэ?") {
      router.push(MOOD_CHECK_ROUTE);
      return;
    }

    // ✅ 2) Local static artifact нээнэ
    if (label === "Сэтгэлзүйн онолын мэдлэг унших") {
      setArtifact((a) => ({
        ...a,
        documentId: "static-psychology",
        kind: "text",
        title: "Сэтгэлзүйн онол – анхан шатны гарын авлага",
        content: THEORY_TEXT,
        status: "idle",
        isVisible: true,
      }));
      return;
    }

    // ✅ 3) Finance товч: hidden intent token нэмээд явуулна
    if (label === "Санхүүгийн баримтаа бүртгүүле") {
      sendText(`${label}\n${FINANCE_INTENT_TOKEN}`);
      return;
    }

    // ✅ 4) Бусад товч: энгийн chat message
    sendText(label);
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
