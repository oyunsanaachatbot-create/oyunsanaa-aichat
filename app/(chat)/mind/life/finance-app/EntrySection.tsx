"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CategoryId, TransactionType } from "./financeTypes";
import { CATEGORY_LABELS, SUBCATEGORY_OPTIONS, categoriesForType } from "./financeCategories";

export function EntrySection(props: {
  guest: boolean;
  onAdd: (payload: {
    type: TransactionType;
    amount: number;
    category: CategoryId;
    subCategory?: string | null;
    date?: string;
    note?: string;
  }) => Promise<void> | void;
  onDeleteAll: () => Promise<void> | void;
  quick: {
    totalIncome: number;
    totalExpense: number;
    debtOutstanding: number;
    // ✅ FinanceAppClient дээр одоохондоо алдаа гарахгүйн тул optional болголоо
    savingBalance?: number;
  };
}) {
  const { guest, onAdd, onDeleteAll, quick } = props;

  const [showEntry, setShowEntry] = useState(true);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [subCategory, setSubCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // type өөрчлөгдөхөд default category + subCategory тохируулна
  useEffect(() => {
    if (type === "income") {
      setCategory("income");
      const opts = SUBCATEGORY_OPTIONS["income"] ?? [];
      setSubCategory(opts[0]?.id ?? "");
      return;
    }

    if (type === "debt") {
      setCategory("debt_borrow");
      const opts = SUBCATEGORY_OPTIONS["debt_borrow"] ?? [];
      setSubCategory(opts[0]?.id ?? "");
      return;
    }

    if (type === "saving") {
      setCategory("saving_add");
      const opts = SUBCATEGORY_OPTIONS["saving_add"] ?? [];
      setSubCategory(opts[0]?.id ?? "");
      return;
    }

    // expense
    setCategory("food");
    const foodOpts = SUBCATEGORY_OPTIONS["food"] ?? [];
    // expense дээр subCategory хоосон байж болно, тиймээс default = ""
    setSubCategory(foodOpts[0]?.id ?? "");
  }, [type]);

  // category өөрчлөгдөхөд тухайн category-н subOptions-оос default тавина
  useEffect(() => {
    const opts = SUBCATEGORY_OPTIONS[category] ?? [];
    if (!opts.length) {
      setSubCategory("");
      return;
    }
    setSubCategory((prev) => (prev ? prev : opts[0].id));
  }, [category]);

  const availableCategoryOptions = useMemo(() => categoriesForType(type), [type]);
  const availableSubOptions = useMemo(() => SUBCATEGORY_OPTIONS[category] ?? [], [category]);
  const showSub = availableSubOptions.length > 0;

  const handleAddClick = async () => {
    const value = Number(amount.replace(/\s/g, ""));
    if (!value || Number.isNaN(value)) return;

    await onAdd({
      type,
      amount: value,
      category,
      subCategory: showSub ? (subCategory || null) : null,
      date: date || undefined,
      note: note.trim() || undefined,
    });

    setAmount("");
    setNote("");
  };

  const savingBalance = quick.savingBalance ?? 0;

  return (
    <section className="mt-6 space-y-3">
      <button
        type="button"
        onClick={() => setShowEntry((v) => !v)}
        className="inline-flex items-center justify-center rounded-full bg-white/80 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium hover:bg-white transition"
      >
        {showEntry ? "❎ Гараар шивэхийг нуух" : "✍️ Гараар гүйлгээ шивэх"}
      </button>

      {guest && (
        <p className="text-[11px] text-amber-200/90">
          Та одоогоор <b>Зочин</b> горимоор ашиглаж байна — энд нэмсэн зүйл <b>хадгалагдахгүй</b>.
        </p>
      )}

      {showEntry && (
        <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Шинэ гүйлгээ нэмэх</span>
          </div>

          {/* 4 төрөл */}
          <div className="flex rounded-xl border border-white/25 bg-white/10 p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 rounded-lg py-1.5 text-xs ${
                type === "expense" ? "bg-rose-500/80 text-white" : "text-slate-100/80"
              }`}
            >
              Зарлага
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 rounded-lg py-1.5 text-xs ${
                type === "income" ? "bg-emerald-500/80 text-white" : "text-slate-100/80"
              }`}
            >
              Орлого
            </button>
            <button
              type="button"
              onClick={() => setType("debt")}
              className={`flex-1 rounded-lg py-1.5 text-xs ${
                type === "debt" ? "bg-amber-500/80 text-white" : "text-slate-100/80"
              }`}
            >
              Өр / Зээл
            </button>
            <button
              type="button"
              onClick={() => setType("saving")}
              className={`flex-1 rounded-lg py-1.5 text-xs ${
                type === "saving" ? "bg-sky-500/80 text-white" : "text-slate-100/80"
              }`}
            >
              Хадгаламж
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 text-xs">
              <label className="text-[11px] text-slate-200">Дүн (₮)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50 000"
                className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
              />
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="text-[11px] text-slate-200">Огноо</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
              />
            </div>

            {/* Категори */}
            <div className="flex flex-col gap-1 text-xs sm:col-span-2">
              <label className="text-[11px] text-slate-200">
                {type === "debt" ? "Зээл — үйлдэл" : type === "saving" ? "Хадгаламж — үйлдэл" : "Категори"}
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                disabled={type === "income"} // income = 1 л категори
              >
                {availableCategoryOptions.map((id) => (
                  <option key={id} value={id} className="bg-slate-900 text-slate-50">
                    {CATEGORY_LABELS[id]}
                  </option>
                ))}
              </select>

              {type === "income" && (
                <p className="text-[10px] text-slate-300">Орлого нь нэг л категори (Орлого). Доороос төрлөө сонгоно.</p>
              )}
            </div>

            {/* Дэд төрөл */}
            {showSub && (
              <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                <label className="text-[11px] text-slate-200">
                  {type === "income"
                    ? "Орлого — төрөл"
                    : type === "debt"
                    ? "Зээл — төрөл"
                    : type === "saving"
                    ? "Хадгаламж — зорилго"
                    : "Дэд төрөл"}
                </label>

                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                >
                  {/* expense үед хоосон байж болно */}
                  {type === "expense" && (
                    <option value="" className="bg-slate-900 text-slate-50">
                      Сонгохгүй (хоосон)
                    </option>
                  )}

                  {availableSubOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-50">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1 text-xs sm:col-span-2">
              <label className="text-[11px] text-slate-200">Тэмдэглэл (сонголттой)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Жишээ: Батдорж – 10% / 12 сар"
                className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-slate-50 outline-none focus:border-white/60 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddClick}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-sky-500/90 hover:bg-sky-400 px-4 py-1.5 text-xs font-medium text-white transition"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Гүйлгээ нэмэх
            </button>

            <button
              type="button"
              onClick={() => onDeleteAll()}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-rose-500/80 hover:bg-rose-400 px-4 py-1.5 text-xs font-medium text-white transition"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Бүгдийг устгах
            </button>
          </div>

          {/* Quick */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">Товч дүн</h3>
            <div className="flex flex-wrap gap-4">
              <p className="text-slate-200">
                Орлого:{" "}
                <span className="text-emerald-300 font-semibold">{quick.totalIncome.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                Зарлага:{" "}
                <span className="text-rose-300 font-semibold">{quick.totalExpense.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                Үлдэгдэл өр:{" "}
                <span className="text-amber-200 font-semibold">{quick.debtOutstanding.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                Хадгаламж:{" "}
                <span className="text-sky-200 font-semibold">{savingBalance.toLocaleString("mn-MN")} ₮</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {!showEntry && <p className="text-[11px] text-slate-300">“Гараар гүйлгээ шивэх” дарж нээгээд нэмэлтээ хийнэ.</p>}
    </section>
  );
}
