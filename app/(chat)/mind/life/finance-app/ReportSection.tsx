"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { Transaction, TransactionType, CategoryId } from "./financeTypes";
import { categoryLabels, subcategoryOptions, subLabel } from "./financeCategories";
import { useLocale, useT } from "@/lib/i18n/provider";

function splitNote(note?: string) {
  const t = (note ?? "").trim();
  if (!t) return { store: "", item: "" };

  const a = t.split("–").map((x) => x.trim()).filter(Boolean);
  if (a.length >= 2) return { store: a[0], item: a.slice(1).join(" – ") };

  const b = t.split("-").map((x) => x.trim()).filter(Boolean);
  if (b.length >= 2) return { store: b[0], item: b.slice(1).join(" - ") };

  return { store: "", item: t };
}

export function ReportSection(props: {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}) {
  const { transactions, onDelete } = props;

  const t = useT();
  const r = t.apps.finance.report;
  const locale = useLocale();
  const labels = categoryLabels(locale);
  const subOptionsByCat = subcategoryOptions(locale);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>(""); // ""=all
  const [category, setCategory] = useState<"" | CategoryId>(""); // ""=all
  const [subCategory, setSubCategory] = useState<string>(""); // ""=all
  const [sortType, setSortType] = useState<"" | "asc" | "desc">("");
  const [storeFilter, setStoreFilter] = useState<string>(""); // ""=all
  const [showResult, setShowResult] = useState(false);

  // store options (note доторх "Дэлгүүр – бараа" форматаас)
  const storeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      const { store } = splitNote(tx.note);
      const s = (store || "").trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "mn"));
  }, [transactions]);

  // subcategory options (category сонгосон үед)
  const subOptions = useMemo(() => {
    if (!category) return [];
    return subOptionsByCat[category] ?? [];
  }, [category, subOptionsByCat]);

  // Filtered transactions
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

  // Summary
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    // debt
    let debtBorrow = 0;
    let debtRepay = 0;

    // saving
    let savingAdd = 0;
    let savingWithdraw = 0;

    const byCatExpense: Record<string, number> = {};
    const byIncomeSub: Record<string, number> = {};
    const byExpenseSub: Record<string, number> = {};

    const byDebtAction: Record<string, number> = {}; // debt_borrow / debt_repay
    const bySavingAction: Record<string, number> = {}; // saving_add / saving_withdraw

    const byItem: Record<string, number> = {};
    const byStore: Record<string, number> = {};

    for (const tx of filtered) {
      if (tx.type === "income") {
        income += tx.amount;
        const key = tx.subCategory || "income_other";
        byIncomeSub[key] = (byIncomeSub[key] ?? 0) + tx.amount;

        const { store, item } = splitNote(tx.note);
        const itemKey = (item || tx.note || r.defaultIncomeTitle).trim();
        if (itemKey) byItem[itemKey] = (byItem[itemKey] ?? 0) + tx.amount;
        const s = (store || "").trim();
        if (s) byStore[s] = (byStore[s] ?? 0) + tx.amount;

        continue;
      }

      if (tx.type === "expense") {
        expense += tx.amount;
        byCatExpense[tx.category] = (byCatExpense[tx.category] ?? 0) + tx.amount;

        if (tx.subCategory) byExpenseSub[tx.subCategory] = (byExpenseSub[tx.subCategory] ?? 0) + tx.amount;

        const { store, item } = splitNote(tx.note);
        const itemKey = (item || tx.note || r.defaultExpenseTitle).trim();
        if (itemKey) byItem[itemKey] = (byItem[itemKey] ?? 0) + tx.amount;
        const s = (store || "").trim();
        if (s) byStore[s] = (byStore[s] ?? 0) + tx.amount;

        continue;
      }

      if (tx.type === "debt") {
        // ✅ ШИНЭ ЛОГИК: өр/зээлийн үйлдэл нь category дээр байна
        if (tx.category === "debt_borrow") debtBorrow += tx.amount;
        if (tx.category === "debt_repay") debtRepay += tx.amount;

        const act = tx.category || "debt_other";
        byDebtAction[act] = (byDebtAction[act] ?? 0) + tx.amount;

        const { store, item } = splitNote(tx.note);
        const itemKey = (item || tx.note || r.defaultDebtTitle).trim();
        if (itemKey) byItem[itemKey] = (byItem[itemKey] ?? 0) + tx.amount;
        const s = (store || "").trim();
        if (s) byStore[s] = (byStore[s] ?? 0) + tx.amount;

        continue;
      }

      if (tx.type === "saving") {
        // ✅ Хадгаламж
        if (tx.category === "saving_add") savingAdd += tx.amount;
        if (tx.category === "saving_withdraw") savingWithdraw += tx.amount;

        const act = tx.category || "saving_other";
        bySavingAction[act] = (bySavingAction[act] ?? 0) + tx.amount;

        const { store, item } = splitNote(tx.note);
        const itemKey = (item || tx.note || r.defaultSavingTitle).trim();
        if (itemKey) byItem[itemKey] = (byItem[itemKey] ?? 0) + tx.amount;
        const s = (store || "").trim();
        if (s) byStore[s] = (byStore[s] ?? 0) + tx.amount;

        continue;
      }
    }

    const balance = income - expense;
    const debtOutstanding = debtBorrow - debtRepay;
    const savingBalance = savingAdd - savingWithdraw;

    return {
      income,
      expense,
      balance,
      debtBorrow,
      debtRepay,
      debtOutstanding,
      savingAdd,
      savingWithdraw,
      savingBalance,
      byCatExpense,
      byIncomeSub,
      byExpenseSub,
      byDebtAction,
      bySavingAction,
      byItem,
      byStore,
    };
  }, [filtered, r]);

  const topItems = useMemo(() => {
    return Object.entries(summary.byItem)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [summary.byItem]);

  const topStores = useMemo(() => {
    return Object.entries(summary.byStore)
      .filter(([k]) => k.length > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [summary.byStore]);

  const topExpenseSub = useMemo(() => {
    return Object.entries(summary.byExpenseSub)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18);
  }, [summary.byExpenseSub]);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setKeyword("");
    setTypeFilter("");
    setCategory("");
    setSubCategory("");
    setSortType("");
    setStoreFilter("");
  };

  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">{r.title}</h2>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-[11px] sm:text-xs">
        <div className="space-y-1">
          <label className="text-slate-200">{r.fromDate}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">{r.toDate}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">{r.keywordLabel}</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={r.keywordPlaceholder}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">{r.typeLabel}</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | TransactionType)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">{r.typeAll}</option>
            <option value="income">{r.typeIncome}</option>
            <option value="expense">{r.typeExpense}</option>
            <option value="debt">{r.typeDebt}</option>
            <option value="saving">{r.typeSaving}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">{r.categoryLabel}</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as CategoryId | "");
              setSubCategory("");
            }}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">{r.typeAll}</option>
            {Object.keys(labels).map((k) => (
              <option key={k} value={k} className="bg-slate-900 text-slate-50">
                {labels[k as CategoryId]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">{r.subCategoryLabel}</label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!category}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60 disabled:opacity-50"
          >
            <option value="">{r.typeAll}</option>
            {subOptions.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-50">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-slate-200">{r.storeLabel}</label>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">{r.typeAll}</option>
            {storeOptions.map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-slate-50">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-200">{r.sortLabel}</label>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as "" | "asc" | "desc")}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-50 outline-none focus:border-white/60"
          >
            <option value="">{r.sortNone}</option>
            <option value="asc">{r.sortAsc}</option>
            <option value="desc">{r.sortDesc}</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="w-full rounded-xl border border-white/25 bg-white/10 px-2 py-1.5 text-[11px] text-slate-100 hover:bg-white/15 transition"
          >
            {r.clearFilters}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowResult((v) => !v)}
        className="inline-flex items-center justify-center rounded-full bg-white/80 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium hover:bg-white transition"
      >
        {showResult ? r.hideReport : r.showReport}
      </button>

      {showResult && (
        <div className="space-y-4">
          {/* Totals */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">{r.totalsTitle}</h3>
            <div className="flex flex-wrap gap-4">
              <p className="text-slate-200">
                {r.income}{" "}
                <span className="text-emerald-300 font-semibold">{summary.income.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                {r.expense}{" "}
                <span className="text-rose-300 font-semibold">{summary.expense.toLocaleString("mn-MN")} ₮</span>
              </p>
              <p className="text-slate-200">
                {r.balance}{" "}
                <span className={summary.balance >= 0 ? "text-sky-300 font-semibold" : "text-amber-300 font-semibold"}>
                  {summary.balance.toLocaleString("mn-MN")} ₮
                </span>
              </p>
              <p className="text-slate-200">
                {r.debtOutstanding}{" "}
                <span className="text-amber-200 font-semibold">
                  {summary.debtOutstanding.toLocaleString("mn-MN")} ₮
                </span>
              </p>
              <p className="text-slate-200">
                {r.saving}{" "}
                <span className="text-sky-200 font-semibold">
                  {summary.savingBalance.toLocaleString("mn-MN")} ₮
                </span>
              </p>
              <p className="text-slate-400">{r.rowsCount.replace("{n}", String(filtered.length))}</p>
            </div>
          </div>

          {/* Expense by category + Income by sub */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">{r.byCategoryTitle}</h3>

              {Object.keys(summary.byCatExpense).length === 0 ? (
                <p className="text-slate-400">{r.noData}</p>
              ) : (
                Object.entries(summary.byCatExpense)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, val]) =>
                    val ? (
                      <div key={cat} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{labels[cat as CategoryId] ?? cat}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
              )}
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">{r.incomeBySubTitle}</h3>

              {Object.keys(summary.byIncomeSub).length === 0 ? (
                <p className="text-slate-400">{r.noIncomeData}</p>
              ) : (
                Object.entries(summary.byIncomeSub)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, val]) =>
                    val ? (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <span className="text-slate-200">{subLabel(k, locale) || r.otherIncome}</span>
                        <span className="font-semibold text-slate-50">{val.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ) : null
                  )
              )}
            </div>
          </div>

          {/* Debt + Saving */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">{r.debtTitle}</h3>
              <div className="flex flex-wrap gap-4">
                <p className="text-slate-200">
                  {r.borrowed}{" "}
                  <span className="text-emerald-200 font-semibold">{summary.debtBorrow.toLocaleString("mn-MN")} ₮</span>
                </p>
                <p className="text-slate-200">
                  {r.repaid}{" "}
                  <span className="text-rose-200 font-semibold">{summary.debtRepay.toLocaleString("mn-MN")} ₮</span>
                </p>
                <p className="text-slate-200">
                  {r.outstanding}{" "}
                  <span className="text-amber-200 font-semibold">{summary.debtOutstanding.toLocaleString("mn-MN")} ₮</span>
                </p>
              </div>

              {Object.keys(summary.byDebtAction).length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {Object.entries(summary.byDebtAction)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-slate-200">{labels[k as CategoryId] ?? k}</span>
                        <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
              <h3 className="font-medium text-slate-100">{r.savingTitle}</h3>
              <div className="flex flex-wrap gap-4">
                <p className="text-slate-200">
                  {r.added}{" "}
                  <span className="text-sky-200 font-semibold">{summary.savingAdd.toLocaleString("mn-MN")} ₮</span>
                </p>
                <p className="text-slate-200">
                  {r.withdrawn}{" "}
                  <span className="text-amber-200 font-semibold">{summary.savingWithdraw.toLocaleString("mn-MN")} ₮</span>
                </p>
                <p className="text-slate-200">
                  {r.outstanding}{" "}
                  <span className="text-emerald-200 font-semibold">{summary.savingBalance.toLocaleString("mn-MN")} ₮</span>
                </p>
              </div>

              {Object.keys(summary.bySavingAction).length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {Object.entries(summary.bySavingAction)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-slate-200">{labels[k as CategoryId] ?? k}</span>
                        <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense subcategory breakdown */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">{r.expenseSubTitle}</h3>

            {topExpenseSub.length === 0 ? (
              <p className="text-slate-400">{r.noExpenseSubData}</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {topExpenseSub.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-slate-200">{subLabel(k, locale) || k}</span>
                    <span className="font-semibold text-slate-50">{v.toLocaleString("mn-MN")} ₮</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOP stores (optional) */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 text-[11px] sm:text-xs">
            <h3 className="font-medium text-slate-100">{r.topStoresTitle}</h3>
            {topStores.length === 0 ? (
              <p className="text-slate-400">{r.noData}</p>
            ) : (
              topStores.map(([name, amt]) => (
                <div key={name} className="flex items-center justify-between border-b border-white/10 py-1">
                  <span className="text-slate-100">{name}</span>
                  <span className="font-semibold text-slate-50">{amt.toLocaleString("mn-MN")} ₮</span>
                </div>
              ))
            )}
          </div>

          {/* Filtered list + delete */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-medium text-slate-100">{r.filteredListTitle}</h3>

            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-400">{r.noFilteredTx}</p>
            ) : (
              filtered.map((tx) => {
                const { store, item } = splitNote(tx.note);
                const title = (item || tx.note || r.defaultTitle).trim();

                const typeLabel =
                  tx.type === "income" ? r.defaultIncomeTitle :
                  tx.type === "expense" ? r.defaultExpenseTitle :
                  tx.type === "debt" ? r.defaultDebtTitle : r.defaultSavingTitle;

                const catLabel = labels[tx.category] ?? tx.category;
                const sub = tx.subCategory ? subLabel(tx.subCategory, locale) : "";

                // ✅ плюс/минус
                const isPlus =
                  tx.type === "income" ||
                  (tx.type === "debt" && tx.category === "debt_borrow") ||
                  (tx.type === "saving" && tx.category === "saving_add");

                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 border-b border-white/10 py-2">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-100">{title}</p>
                      <p className="text-[10px] text-slate-400">
                        {tx.date} · {typeLabel} · {catLabel}
                        {sub ? ` · ${sub}` : ""}
                        {store ? ` · ${store}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-50">
                        {isPlus ? "+ " : "- "}
                        {tx.amount.toLocaleString("mn-MN")} ₮
                      </span>

                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        className="text-slate-400 hover:text-rose-300 transition"
                        aria-label={t.apps.finance.deleteAria}
                        title={t.apps.finance.deleteTitle}
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
        <p className="text-[11px] text-slate-300">{r.collapsedHint}</p>
      )}
    </section>
  );
}
