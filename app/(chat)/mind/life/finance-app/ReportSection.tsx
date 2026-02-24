"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { CategoryId, Transaction, TransactionType } from "./financeTypes";
import { CATEGORY_LABELS, SUBCATEGORY_OPTIONS, subLabel } from "./financeCategories";

export function ReportSection(props: {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}) {
  const { transactions, onDelete } = props;

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<"" | CategoryId>(""); // ""=бүгд
  const [subCategory, setSubCategory] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>(""); // ""=бүгд
  const [sortType, setSortType] = useState<"" | "asc" | "desc">("");
  const [storeFilter, setStoreFilter] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "bar">("list");

  const splitNote = (note?: string) => {
    const t = (note ?? "").trim();
    if (!t) return { store: "", item: "" };

    const a = t.split("–").map((x) => x.trim()).filter(Boolean);
    if (a.length >= 2) return { store: a[0], item: a.slice(1).join(" – ") };

    const b = t.split("-").map((x) => x.trim()).filter(Boolean);
    if (b.length >= 2) return { store: b[0], item: b.slice(1).join(" - ") };

    return { store: "", item: t };
  };

  // store options
  const storeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      const { store } = splitNote(tx.note);
      const s = (store || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "mn"));
  }, [transactions]);

  // category based sub options
  const subOptions = useMemo(() => {
    if (!category) return [];
    return SUBCATEGORY_OPTIONS[category] ?? [];
  }, [category]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();

    return transactions
      .filter((tx) => (fromDate ? tx.date >= fromDate : true))
      .filter((tx) => (toDate ? tx.date <= toDate : true))
      .filter((tx) => (typeFilter ? tx.type === typeFilter : true))
      .filter((tx) => (category ? tx.category === category : true))
      .filter((tx) => (subCategory ? (tx.subCategory ?? "") === subCategory : true))
      .filter((tx) => {
        if (!storeFilter) return true;
        const { store } = splitNote(tx.note);
        return (store || "").trim() === storeFilter;
      })
      .filter((tx) => {
        if (!k) return true;
        const { store, item } = splitNote(tx.note);
        return (
          (item || "").toLowerCase().includes(k) ||
          (store || "").toLowerCase().includes(k) ||
          (tx.note || "").toLowerCase().includes(k)
        );
      })
      .sort((a, b) => {
        if (sortType === "asc") return a.amount - b.amount;
        if (sortType === "desc") return b.amount - a.amount;
        return 0;
      });
  }, [transactions, fromDate, toDate, keyword, typeFilter, category, subCategory, sortType, storeFilter]);
const summary = useMemo(() => {
  let income = 0;
  let expense = 0;

  // expense by category (зөвхөн зарлага)
  const byCatExpense = {
    food: 0,
    transport: 0,
    clothes: 0,
    home: 0,
    fun: 0,
    health: 0,
    other: 0,
  };

  const byIncomeSub: Record<string, number> = {};
  const byExpenseSub: Record<string, number> = {};

  let debtBorrow = 0;
  let debtRepay = 0;

  for (const tx of filtered) {
    if (tx.type === "income") {
      income += tx.amount;
      if (tx.subCategory) {
        byIncomeSub[tx.subCategory] =
          (byIncomeSub[tx.subCategory] ?? 0) + tx.amount;
      }
    }

    if (tx.type === "expense") {
      expense += tx.amount;

      if (byCatExpense.hasOwnProperty(tx.category)) {
        byCatExpense[tx.category as keyof typeof byCatExpense] += tx.amount;
      }

      if (tx.subCategory) {
        byExpenseSub[tx.subCategory] =
          (byExpenseSub[tx.subCategory] ?? 0) + tx.amount;
      }
    }

    if (tx.type === "debt") {
      if (tx.subCategory === "debt_borrow") {
        debtBorrow += tx.amount;
      }
      if (tx.subCategory === "debt_repay") {
        debtRepay += tx.amount;
      }
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
    debtBorrow,
    debtRepay,
    debtOutstanding: debtBorrow - debtRepay,
    byCatExpense,
    byIncomeSub,
    byExpenseSub,
  };
}, [filtered]); 

  const balance = summary.income - summary.expense;

  const topItems = useMemo(() => {
    return Object.entries(summary.byItem)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [summary.byItem]);

  const topExpenseSub = useMemo(() => {
    return Object.entries(summary.byExpenseSub)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18);
  }, [summary.byExpenseSub]);

  const maxTopItem = topItems.length ? Math.max(...topItems.map(([, v]) => v)) : 0;

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setKeyword("");
    setCategory("");
    setSubCategory("");
    setTypeFilter("");
    setSortType("");
    setStoreFilter("");
  };

  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">📊 CHECK / Тайлан</h2>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-[11px] sm:text-xs">
        <div className="space-y-1">
          <label className="text-slate-200">Эхлэх огноо</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Дуусах огноо</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Тэмдэглэл / бараагаар</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="талх, эм, цалин..."
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Төрөл</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | TransactionType)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            <option value="income">Зөвхөн орлого</option>
            <option value="expense">Зөвхөн зарлага</option>
            <option value="debt">Зөвхөн өр/зээл</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Категори</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as CategoryId | "");
              setSubCategory("");
            }}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            <option value="income">Орлого</option>
            <option value="debt">Өр / Зээл</option>
            <option value="food">Хоол, хүнс</option>
            <option value="transport">Тээвэр</option>
            <option value="clothes">Хувцас</option>
            <option value="home">Гэр, хэрэглээ</option>
            <option value="fun">Зугаа, чөлөөт цаг</option>
            <option value="health">Эрүүл мэнд</option>
            <option value="other">Бусад</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Дэд төрөл</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!category}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60 disabled:opacity-50"
          >
            <option value="">Бүгд</option>
            {subOptions.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-50">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-slate-200">Дэлгүүр (сонголттой)</label>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Бүгд</option>
            {storeOptions.map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-slate-50">
                {s}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">Note дотор “Дэлгүүр – бараа” хэлбэр байвал дэлгүүрээр шүүнэ.</p>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">Дүнгээр эрэмбэлэх</label>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as "" | "asc" | "desc")}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">Энгийн</option>
            <option value="asc">Бага → их</option>
            <option value="desc">Их → бага</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-100 hover:bg-white/15 transition"
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setShowResult((v) => !v)}
        className="inline-flex items-center justify-center rounded-full bg-white/80 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium hover:bg-white transition"
      >
        {showResult ? "❎ Тайланг нуух" : "✅ Тайлан гаргах"}
      </button>

      {showResult && (
        <div className="space-y-4">
          {/* Totals */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">Нийт дүн</h3>
            <div className="flex flex-wrap gap-4">
              <p className="text-slate-200">
                Орлого: <span className="text-emerald-300 font-semibold">{summary.income.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                Зарлага: <span className="text-rose-300 font-semibold">{summary.expense.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                Үлдэгдэл:{" "}
                <span className={balance >= 0 ? "text-sky-300 font-semibold" : "text-amber-300 font-semibold"}>
                  {balance.toLocaleString("mn-MN")} ₮
                </span>
              </p>

              <p className="text-slate-200">
                Өр (үлдэгдэл):{" "}
                <span className="text-amber-200 font-semibold">{summary.debtOutstanding.toLocaleString("mn-MN")} ₮</span>
              </p>

              <p className="text-slate-400">(Гүйлгээ: {filtered.length} мөр)</p>
            </div>
          </div>

          {/* Expense by category + Income by sub */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">Том ангиллаар (зарлага)</h3>
              {Object.entries(summary.byCatExpense).every(([, v]) => v === 0) ? (
                <p className="text-slate-400">Өгөгдөл алга.</p>
              ) : (
                Object.entries(summary.byCatExpense)
                  .filter(([k]) => k !== "income" && k !== "debt")
                  .map(([cat, val]) =>
                    val ? (
                      <div key={cat} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{CATEGORY_LABELS[cat as CategoryId]}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
              )}
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">Орлого — төрлөөр (цалин/бонус/…)</h3>

              {Object.keys(summary.byIncomeSub).length === 0 ? (
                <p className="text-slate-400">Орлогын өгөгдөл алга.</p>
              ) : (
                Object.entries(summary.byIncomeSub)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, val]) =>
                    val ? (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{subLabel(k) || "Бусад орлого"}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
              )}
            </div>
          </div>

          {/* Debt */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">Өр / Зээл</h3>
            <div className="grid sm:grid-cols-3 gap-2">
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-slate-200">Зээл авсан</span>
                <span className="font-semibold text-slate-50">{summary.debtBorrow.toLocaleString("mn-MN")} ₮</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-slate-200">Зээл төлсөн</span>
                <span className="font-semibold text-slate-50">{summary.debtRepay.toLocaleString("mn-MN")} ₮</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-slate-200">Үлдэгдэл өр</span>
                <span className="font-semibold text-amber-200">{summary.debtOutstanding.toLocaleString("mn-MN")} ₮</span>
              </div>
            </div>
          </div>

          {/* Expense subcategory only */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">Дэд ангиллаар (Зөвхөн зарлага)</h3>
            {topExpenseSub.length === 0 ? (
              <p className="text-slate-400">Зарлагын дэд ангиллын өгөгдөл алга.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {topExpenseSub.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-slate-200">{subLabel(k)}</span>
                    <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400">Энэ хэсэг зөвхөн “Зарлага”-ын дэд ангиллыг харуулна.</p>
          </div>

          {/* Top items */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-100">🍞 TOP бараа / хэрэглээ</h3>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-2 py-0.5 rounded-full ${viewMode === "list" ? "bg-white text-slate-900" : "text-slate-100"}`}
                >
                  Жагсаалт
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("bar")}
                  className={`px-2 py-0.5 rounded-full ${viewMode === "bar" ? "bg-white text-slate-900" : "text-slate-100"}`}
                >
                  Bar
                </button>
              </div>
            </div>

            {topItems.length === 0 ? (
              <p className="text-slate-400">Өгөгдөл алга.</p>
            ) : viewMode === "list" ? (
              topItems.map(([name, amt]) => (
                <div key={name} className="flex items-center justify-between border-b border-white/10 py-1">
                  <span className="text-slate-100">{name}</span>
                  <span className="font-semibold text-slate-50">{amt.toLocaleString("mn-MN")} ₮</span>
                </div>
              ))
            ) : (
              <div className="space-y-1.5">
                {topItems.map(([name, amt]) => {
                  const percent = maxTopItem > 0 ? Math.round((amt / maxTopItem) * 100) : 0;
                  return (
                    <div key={name} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-100">{name}</span>
                        <span className="font-semibold text-slate-50">{amt.toLocaleString("mn-MN")} ₮</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-sky-400/80" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filtered transactions */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-medium text-slate-100">Фильтртэй гүйлгээнүүд</h3>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-400">Тэнцсэн гүйлгээ алга байна.</p>
            ) : (
              filtered.map((tx) => {
                const { store, item } = splitNote(tx.note);
                const title = (item || tx.note || "Гүйлгээ").trim();
                const sub = tx.subCategory ? subLabel(tx.subCategory) : "";

                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 border-b border-white/10 py-2">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-100">{title}</p>
                      <p className="text-[10px] text-slate-400">
                        {tx.date} ·{" "}
                        {tx.type === "income" ? "Орлого" : tx.type === "debt" ? "Өр/Зээл" : "Зарлага"} ·{" "}
                        {CATEGORY_LABELS[tx.category]}
                        {sub ? ` · ${sub}` : ""}
                        {store ? ` · ${store}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-50">
                        {tx.type === "income" || (tx.type === "debt" && tx.subCategory === "debt_borrow") ? "+ " : "- "}
                        {tx.amount.toLocaleString("mn-MN")} ₮
                      </span>

                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        className="text-slate-400 hover:text-rose-300 transition"
                        aria-label="Delete"
                        title="Устгах"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!showResult && (
        <p className="text-[11px] text-slate-300">Хугацаагаа сонгоод “Тайлан гаргах” дар. Нуух дарвал зөвхөн товч үлдэнэ.</p>
      )}
    </section>
  );
}
