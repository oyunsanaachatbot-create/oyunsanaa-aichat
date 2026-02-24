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
  }) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  quick: { totalIncome: number; totalExpense: number; debtOutstanding: number };
}) {
  const { guest, onAdd, onDeleteAll, quick } = props;

  const [showEntry, setShowEntry] = useState(false);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [subCategory, setSubCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // type өөрчлөгдөхөд default тохируулга
  useEffect(() => {
    if (type === "income") {
      setCategory("income");
      setSubCategory("");
    } else if (type === "debt") {
      setCategory("debt_borrow"); // ✅ default: зээл авах
      setSubCategory("loan_salary"); // ✅ default: цалингийн зээл
    } else if (type === "saving") {
      setCategory("saving");
      setSubCategory("saving_personal");
    } else {
      // expense
      if (category === "income" || category === "debt_borrow" || category === "debt_repay" || category === "saving")
        setCategory("food");
      setSubCategory("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // category өөрчлөгдөхөд sub default
  useEffect(() => {
    if (type === "income") setSubCategory("");
    else if (type === "debt") setSubCategory((v) => v || "loan_salary");
    else if (type === "saving") setSubCategory((v) => v || "saving_personal");
    else setSubCategory("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const availableCategoryOptions = useMemo(() => categoriesForType(type), [type]);
  const availableSubOptions = useMemo(() => SUBCATEGORY_OPTIONS[category] ?? [], [category]);
  const showSub = availableSubOptions.length > 0;

  const handleAddClick = async () => {
    const value = Number(amount.replace(/\s/g, ""));
    if (!value || isNaN(value)) return;

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
    // keep sensible defaults
    if (type === "debt") setSubCategory("loan_salary");
    else if (type === "saving") setSubCategory("saving_personal");
    else setSubCategory("");
  };

  return (
    <section className="mt-8 space-y-3">
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
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Шинэ гүйлгээ нэмэх</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 text-xs col-span-2">
                <span className="text-[11px] text-slate-200">Төрөл</span>
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
              </div>

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

              {/* ✅ Категори */}
              <div className="flex flex-col gap-1 text-xs col-span-2">
                <label className="text-[11px] text-slate-200">
                  {type === "debt" ? "Категори (Зээл авах / Зээл төлөх)" : "Категори"}
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                  disabled={type === "income" || type === "saving"} // income & saving fixed
                >
                  {availableCategoryOptions.map((id) => (
                    <option key={id} value={id} className="bg-slate-900 text-slate-50">
                      {CATEGORY_LABELS[id]}
                    </option>
                  ))}
                </select>

                {(type === "income" || type === "saving") && (
                  <p className="text-[10px] text-slate-300">
                    {type === "income"
                      ? "Орлого нь нэг л категори (Орлого). Доороос “төрөл”-өө сонгоно."
                      : "Хадгаламж нь нэг л категори (Хадгаламж). Доороос “төрөл”-өө сонгоно."}
                  </p>
                )}
              </div>
            </div>

            {/* ✅ Дэд ангилал */}
            {showSub && (
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[11px] text-slate-200">
                  {type === "income"
                    ? "Орлого — төрөл"
                    : type === "debt"
                    ? "Зээлийн төрөл (ипотек/лизинг/…)"
                    : type === "saving"
                    ? "Хадгаламж — төрөл"
                    : "Дэд төрөл"}
                </label>

                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-slate-50 outline-none focus:border-white/60"
                >
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

            <div className="flex flex-col gap-1 text-xs">
              <label className="text-[11px] text-slate-200">
                Тэмдэглэл (сонголттой){" "}
                {type === "debt" ? "— хүн/банк/компани (ж: Batdorj, Хаан банк, Sono)" : ""}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={type === "debt" ? "Жишээ: Batdorj – гар утас" : "Жишээ: E-mart – талх"}
                className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-slate-50 outline-none focus:border-white/60 resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddClick}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-sky-500/90 hover:bg-sky-400 px-4 py-1.5 text-xs font-medium text-white transition"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Гүйлгээ хадгалах
              </button>

              <button
                type="button"
                onClick={onDeleteAll}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-rose-500/80 hover:bg-rose-400 px-4 py-1.5 text-xs font-medium text-white transition"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Бүгдийг устгах
              </button>
            </div>
          </div>

          {/* Quick summary */}
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
            </div>
          </div>
        </div>
      )}

      {!showEntry && (
        <p className="text-[11px] text-slate-300">
          “Гараар гүйлгээ шивэх” дарж нээгээд нэмэлтээ хийнэ. Нуух дарвал зөвхөн товч үлдэнэ.
        </p>
      )}
    </section>
  );
}
