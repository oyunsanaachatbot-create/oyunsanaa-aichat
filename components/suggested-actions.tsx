"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import type { ChatMessage } from "@/lib/types";
import type { VisibilityType } from "./visibility-selector";
import { Suggestion } from "./elements/suggestion";
import { useArtifact, useArtifactSelector } from "@/hooks/use-artifact";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

const THEORY_TEXT = `# Сэтгэлзүйн онол – товч

- Сэтгэл санаа, бодол, зан үйл 3 нь хоорондоо холбоотой.
- Сэтгэл хөдлөл хурдан, сэтгэл санаа удаан үргэлжилнэ.
- Өдөр тутам: унтах, хөдөлгөөн, харилцаа хамгийн хүчтэй нөлөөлнө.

💬 Эндээс аль хэсэг нь танд яг тохирч байна? Тайлбарлаад асуугаарай.`;

type TransactionType = "income" | "expense";
type CategoryId = "food" | "transport" | "clothes" | "home" | "fun" | "health" | "other";

type FinanceDraft = {
  date: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  note?: string;
  raw_text?: string;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const pathname = usePathname();
  const artifactVisible = useArtifactSelector((s) => s.isVisible);
  const { setArtifact } = useArtifact();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  if (artifactVisible) return null;
  if (pathname !== "/") return null;

  const suggestedActions = [
    "Өнөөдрийн сэтгэл санаа хэр байна вэ?",
    "Санхүүгийн баримтаа бүртгүүлье",
    "Оюунсанаа төслийн танилцуулга",
    "Хоолны задаргаа хийж өгөөч",
  ];

  const openFinancePicker = () => {
    // file picker нээх
    fileInputRef.current?.click();
  };

  const handleFinanceFile = async (file: File) => {
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/finance/analyze", {
        method: "POST",
        body: form,
      });

      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(payload?.error || "Алдаа гарлаа");

      // ✅ API нь {drafts:[]} эсвэл {list:[]} байж болно
      const drafts: FinanceDraft[] = (payload?.drafts || payload?.list || []).map((d: any) => ({
        date: d?.date || "",
        amount: Number(d?.amount) || 0,
        type: d?.type === "income" ? "income" : "expense",
        category: (d?.category || "other") as CategoryId,
        note: d?.note || "",
        raw_text: d?.raw_text || "",
      }));

      // Chat renderer чинь FINANCE_JSON tag-ийг барьж card гаргадаг бол хамгийн амар
      const financeJson = JSON.stringify({ drafts }, null, 2);

      // 1) User талд "баримт орууллаа" гэж богино message
          // 1) user талд "баримт орууллаа" гэж богино message
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: "Санхүүгийн баримтаа орууллаа 🧾" }],
      });

      // 2) FINANCE_JSON tag-тай message (UI чинь үүнийг parse хийгээд card болгож гаргана)
      const financeJson = JSON.stringify({ drafts }, null, 2);

      sendMessage({
        role: "user",
        parts: [
          {
            type: "text",
            text:
              `<FINANCE_HUMAN>Баримтаас уншсан гүйлгээнүүдийг доорх карт дээр шалгаад “Тайланд хадгалах/нэмэх” дарна уу.</FINANCE_HUMAN>\n` +
              `<FINANCE_JSON>${financeJson}</FINANCE_JSON>`,
          },
        ],
      });


      // 🔁 Хэрэв дээрх assistant role ажиллахгүй бол энэ мөрийг ашигла:
      // sendMessage({ role: "user", parts: [{ type: "text", text: `<FINANCE_JSON>${financeJson}</FINANCE_JSON>` }] });
       } catch (e: any) {
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: `Баримт уншихад алдаа гарлаа: ${e?.message || "unknown"}` }],
      });
    }

    } finally {
      setUploading(false);
    }
  };

  const handleClick = (label: string) => {
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

    if (label === "Санхүүгийн баримтаа бүртгүүлье") {
      openFinancePicker();
      return;
    }

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: label }],
    });
  };

  return (
    <>
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFinanceFile(file);
        }}
      />

      {uploading && (
        <div className="mb-2 text-[11px] text-[#1F6FB2]">
          Баримтыг уншиж байна… (AI)
        </div>
      )}

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
    </>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false;
  return true;
});
