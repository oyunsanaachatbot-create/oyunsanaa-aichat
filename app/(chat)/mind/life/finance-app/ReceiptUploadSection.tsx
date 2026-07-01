"use client";

import { Camera, CheckCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import type { CategoryId } from "./financeTypes";

type Draft = {
  date: string;
  amount: number;
  type: "income" | "expense";
  category: CategoryId;
  note: string;
  selected: boolean;
};

type Props = {
  onAdd: (payload: {
    type: "income" | "expense";
    amount: number;
    category: CategoryId;
    date?: string;
    note?: string;
    source?: "receipt";
  }) => Promise<void>;
};

export function ReceiptUploadSection({ onAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setSaved(false);
    setDrafts([]);
    setAnalyzing(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/finance/analyze", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error ?? "Баримт уншихад алдаа гарлаа.");
        return;
      }

      const list: Omit<Draft, "selected">[] = (json.drafts ?? []).filter(
        (d: any) => d?.amount > 0
      );

      if (!list.length) {
        setError("Баримтаас гүйлгээний мэдээлэл олдсонгүй.");
        return;
      }

      setDrafts(list.map((d) => ({ ...d, selected: true })));
    } catch {
      setError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { handleFile(file); }
    e.target.value = "";
  };

  const toggleDraft = (i: number) => {
    setDrafts((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleSave = async () => {
    const selected = drafts.filter((d) => d.selected);
    if (!selected.length) { return; }
    setSaving(true);
    try {
      for (const d of selected) {
        await onAdd({
          type: d.type,
          amount: d.amount,
          category: d.category,
          date: d.date || undefined,
          note: d.note || undefined,
          source: "receipt",
        });
      }
      setSaved(true);
      setDrafts([]);
    } finally {
      setSaving(false);
    }
  };

  const clear = () => {
    setDrafts([]);
    setError(null);
    setSaved(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">🧾 Баримт уншуулах</h3>
        {drafts.length > 0 && (
          <button
            className="text-[11px] text-slate-400 hover:text-slate-600"
            onClick={clear}
            type="button"
          >
            <X className="inline h-3.5 w-3.5" /> цэвэрлэх
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        Дэлгүүрийн баримтын зураг оруулахад AI автоматаар уншиж,
        гүйлгээний бүртгэл болгон хадгална.
      </p>

      <input
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      {!analyzing && !drafts.length && !saved && (
        <button
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Camera className="h-4 w-4 text-sky-500" />
          Баримтын зураг оруулах
        </button>
      )}

      {analyzing && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="animate-spin">⏳</span> AI уншиж байна…
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Амжилттай хадгаллаа!
          <button
            className="ml-2 underline"
            onClick={() => { setSaved(false); inputRef.current?.click(); }}
            type="button"
          >
            Дахин оруулах
          </button>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">
            Хадгалах гүйлгээнүүдийг сонго:
          </p>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {drafts.map((d, i) => (
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2 text-xs transition-colors ${
                  d.selected
                    ? "border-sky-200 bg-sky-50/60"
                    : "border-slate-200 bg-white opacity-60"
                }`}
                key={i}
              >
                <input
                  checked={d.selected}
                  className="mt-0.5 accent-sky-500"
                  onChange={() => toggleDraft(i)}
                  type="checkbox"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800 truncate">
                      {d.note || d.category}
                    </span>
                    <span
                      className={`shrink-0 font-semibold ${
                        d.type === "income" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {d.type === "income" ? "+" : "−"}
                      {d.amount.toLocaleString("mn-MN")} ₮
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {d.date} · {d.category}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-full bg-sky-500/90 hover:bg-sky-400 px-4 py-1.5 text-xs font-medium text-white transition disabled:opacity-60"
              disabled={saving || !drafts.some((d) => d.selected)}
              onClick={handleSave}
              type="button"
            >
              {saving ? "Хадгалж байна…" : `📥 ${drafts.filter((d) => d.selected).length} гүйлгээ хадгалах`}
            </button>
            <button
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              Өөр зураг
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
