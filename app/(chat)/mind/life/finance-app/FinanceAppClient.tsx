"use client";

import { Trash2 } from "lucide-react";

import { AppShell } from "@/components/mind/app-shell";
import { CATEGORY_LABELS, subLabel } from "./financeCategories";
import { useTransactions } from "./useTransactions";
import { ReportSection } from "./ReportSection";
import { EntrySection } from "./EntrySection";

type Props = { userId: string };

export default function FinanceAppClient({ userId }: Props) {
  const {
    guest,
    loading,
    transactions,
    totals,
    addTransaction,
    deleteTransaction,
    deleteAll,
  } = useTransactions(userId);

  return (
    <AppShell
      title="Санхүүгээ энгийнээр хөтлөх жижиг туслах"
      subtitle="Миний санхүү (жижиг апп)"
      width="4xl"
    >
      <div className="space-y-6 text-slate-50">
        <section className="space-y-2">
          {loading && <div className="text-[11px] text-slate-300">Ачаалж байна…</div>}

          {!loading && guest && (
            <div className="text-[11px] text-amber-200/90">
              Та <b>Зочин</b> горимоор байна — өгөгдөл хадгалагдахгүй.
            </div>
          )}

          <p className="text-[11px] sm:text-xs text-slate-200">
            Нийт орлого:{" "}
            <span className="text-emerald-300 font-semibold">{totals.totalIncome.toLocaleString("mn-MN")} ₮</span>{" "}
            · Нийт зарлага:{" "}
            <span className="text-rose-300 font-semibold">{totals.totalExpense.toLocaleString("mn-MN")} ₮</span>{" "}
            · Үлдэгдэл:{" "}
            <span className={`font-semibold ${totals.balance >= 0 ? "text-sky-300" : "text-amber-300"}`}>
              {totals.balance.toLocaleString("mn-MN")} ₮
            </span>{" "}
            · Үлдэгдэл өр:{" "}
            <span className="text-amber-200 font-semibold">{totals.debtOutstanding.toLocaleString("mn-MN")} ₮</span>
          </p>
        </section>

        {/* ✅ Тайлан */}
        <ReportSection transactions={transactions} onDelete={deleteTransaction} />

          {/* ✅ Гараар шивэх */}
          <EntrySection
  guest={guest}
  onAdd={addTransaction}
  onDeleteAll={deleteAll}
  quick={{
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    debtOutstanding: totals.debtOutstanding,
    savingBalance: totals.savingBalance,
  }}
/>          {/* ✅ Сүүлийн гүйлгээнүүд (гар дээр байнга харагдана) */}
          <section className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-100">Сүүлийн гүйлгээнүүд</h3>

            {transactions.length === 0 ? (
              <p className="text-[12px] text-slate-300">Одоогоор ямар ч гүйлгээ алга.</p>
            ) : (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {transactions.map((t) => {
                  const isPlus =
                    t.type === "income" || (t.type === "debt" && t.subCategory === "debt_borrow");
                  const typeLabel = t.type === "income" ? "Орлого" : t.type === "debt" ? "Өр/Зээл" : "Зарлага";
                  const sub = t.subCategory ? subLabel(t.subCategory) : "";

                  return (
                    <div key={t.id} className="flex items-start justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={isPlus ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
                            {isPlus ? "+ " : "- "}
                            {t.amount.toLocaleString("mn-MN")} ₮
                          </span>

                          <span className="text-[11px] text-slate-300">
                            {typeLabel} · {CATEGORY_LABELS[t.category]}
                          </span>

                          {sub && (
                            <span className="text-[10px] text-slate-200/80 border border-white/15 bg-white/5 px-2 py-0.5 rounded-full">
                              {sub}
                            </span>
                          )}
                        </div>

                        {t.note && <p className="text-[11px] text-slate-100/90">{t.note}</p>}

                        <p className="text-[10px] text-slate-400">
                          {t.date} ·{" "}
                          {t.source === "text"
                            ? "гараар"
                            : t.source === "voice"
                            ? "voice-оор"
                            : t.source === "receipt"
                            ? "баримтаас"
                            : "зурагнаас"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTransaction(t.id)}
                        className="mt-1 text-slate-400 hover:text-rose-300 transition"
                        aria-label="Delete"
                        title="Устгах"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
        </section>
      </div>
    </AppShell>
  );
}
