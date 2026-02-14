"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TransactionType = "income" | "expense";
type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

const CATEGORY_LABELS: Record<CategoryId, string> = {
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",
};

type FinanceDraft = {
  date: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  note?: string;
};

type Props = {
  active: boolean;              // finance mode асаалттай эсэх
  userId: string | null;        // ✅ NextAuth session.user.id
  onDone?: () => void;
};

function normalizeCategory(raw: any): CategoryId | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.toLowerCase().trim();

  if (t === "food" || t.includes("хоол") || t.includes("хүнс")) return "food";
  if (t === "transport" || t.includes("тээвэр") || t.includes("такси") || t.includes("bus")) return "transport";
  if (t === "clothes" || t.includes("хувцас") || t.includes("гутал")) return "clothes";
  if (t === "home" || t.includes("гэр") || t.includes("цахилгаан") || t.includes("түрээс")) return "home";
  if (t === "health" || t.includes("эм") || t.includes("эмнэлэг") || t.includes("шүд")) return "health";
  if (t === "fun" || t.includes("кино") || t.includes("зугаа") || t.includes("караоке")) return "fun";
  if (t === "other") return "other";
  return null;
}

function detectCategoryFromText(text: string): CategoryId {
  const t = (text || "").toLowerCase();

  if (t.includes("хоол") || t.includes("хүнс") || t.includes("талх") || t.includes("кофе") || t.includes("ундаа") || t.includes("market"))
    return "food";
  if (t.includes("такси") || t.includes("ubus") || t.includes("тээвэр") || t.includes("шатахуун") || t.includes("бензин"))
    return "transport";
  if (t.includes("хувцас") || t.includes("гутал") || t.includes("цамц") || t.includes("пүүз"))
    return "clothes";
  if (t.includes("түрээс") || t.includes("цахилгаан") || t.includes("ус") || t.includes("ариун цэвэр") || t.includes("тавилга"))
    return "home";
  if (t.includes("эм") || t.includes("эмнэлэг") || t.includes("клиник") || t.includes("шүд") || t.includes("витамин"))
    return "health";
  if (t.includes("кино") || t.includes("концерт") || t.includes("karaoke") || t.includes("тоглолт") || t.includes("саун"))
    return "fun";

  return "other";
}

export function FinanceCapturePanel({ active, userId, onDone }: Props) {
  const [drafts, setDrafts] = useState<FinanceDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!active) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/finance/analyze", { method: "POST", body: form });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || "Алдаа гарлаа");
      }

      const today = new Date().toISOString().slice(0, 10);

      const mapped: FinanceDraft[] = (payload?.drafts || []).map((d: any): FinanceDraft => {
        const normalized = normalizeCategory(d.category);
        const detected = detectCategoryFromText(d.note || d.raw_text || d.description || "");

        return {
          date: d.date || today,
          amount: Number(d.amount) || 0,
          type: d.type === "income" ? "income" : "expense",
          category: (normalized ?? detected ?? "other") as CategoryId,
          note: d.note || "",
        };
      });

      setDrafts(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Server error");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleChangeDraft = (index: number, patch: Partial<FinanceDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSaveDraft = async (draft: FinanceDraft, index: number) => {
    try {
      setSavingId(index);
      setError(null);

      if (!userId) {
        throw new Error("Нэвтрээгүй байна. Дахин login хийгээд оролдоорой.");
      }

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: userId, // ✅ алтан дүрэм
        type: draft.type,
        amount: draft.amount,
        category: draft.category,
        date: draft.date,
        note: draft.note ?? "",
        source: "image",
        raw_text: draft.note ?? "",
      });

      if (insertError) throw insertError;

      setDrafts((prev) => prev.filter((_, i) => i !== index));
      onDone?.();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Хадгалах үед алдаа гарлаа");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-700">
          Санхүүгийн баримтын зураг оруулбал AI таньж хүснэгт/карт болгож өгнө.
          Шалгаад “Тайланд нэмэх” дарвал тайланд хадгална.
        </div>

        <label className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] px-3 py-1.5 font-medium cursor-pointer hover:bg-emerald-500">
          {loading ? "Уншиж байна..." : "Зураг оруулах"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {drafts.length === 0 && !loading && (
        <p className="text-[11px] text-slate-500">
          Одоогоор AI-с ирсэн draft алга. Эхлээд баримтын зураг оруулаарай.
        </p>
      )}

      <div className="space-y-2">
        {drafts.map((d, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 space-y-2 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">Огноо</span>
                <input
                  type="date"
                  value={d.date}
                  onChange={(e) => handleChangeDraft(index, { date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500">Дүн (₮)</span>
                <input
                  type="number"
                  value={d.amount}
                  onChange={(e) => handleChangeDraft(index, { amount: Number(e.target.value || 0) })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500">Төрөл</span>
                <select
                  value={d.type}
                  onChange={(e) => handleChangeDraft(index, { type: e.target.value as TransactionType })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1"
                >
                  <option value="expense">Зарлага</option>
                  <option value="income">Орлого</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500">Категори</span>
                <select
                  value={d.category}
                  onChange={(e) => handleChangeDraft(index, { category: e.target.value as CategoryId })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1"
                >
                  {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-500">Тэмдэглэл</span>
              <input
                value={d.note || ""}
                onChange={(e) => handleChangeDraft(index, { note: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-2 py-1"
                placeholder="талх, кофе, такси..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingId === index}
                onClick={() => handleSaveDraft(d, index)}
                className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-[11px] font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingId === index ? "Хадгалж байна..." : "Тайланд нэмэх"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
