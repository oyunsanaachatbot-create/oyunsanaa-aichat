"use client";

import Link from "next/link";
import { Coffee, MessageCircle, Trash2 } from "lucide-react";
import { useMemo } from "react";

import type { Transaction } from "./financeTypes";
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
    <div className="min-h-screen relative text-slate-50 bg-gradient-to-b from-[#020c1a] via-[#071a33] to-[#010712]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-sky-400/28 blur-3xl" />
        <div className="absolute top-[-10%] right-[-8%] w-[360px] h-[360px] rounded-full bg-cyan-400/22 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-7 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl border border-white/18 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-5 py-7 space-y-7">
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-100/90">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 border border-white/35">
                  <Coffee className="h-4 w-4" />
                </span>
                <span>Тогтвортой амьдрал</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-50">
                <span>Миний санхүү (жижиг апп)</span>
              </div>

              {loading && <div className="text-[11px] text-slate-300">Ачаалж байна…</div>}

              {!loading && guest && (
                <div className="text-[11px] text-amber-200/90">
                  Та <b>Зочин</b> горимоор байна — өгөгдөл хадгалагдахгүй.
                </div>
              )}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[12px] font-medium text-slate-50 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Чат руу буцах</span>
              <span className="sm:hidden">Чат</span>
            </Link>
          </div>

          <section className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug text-[#DCE8FF] drop-shadow-[0_0_12px_rgba(220,232,255,0.55)]">
              Санхүүгээ энгийнээр хөтлөх жижиг туслах
            </h1>

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
            }}
          />

          {/* ✅ Сүүлийн гүйлгээнүүд (гар дээр байнга харагдана) */}
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
      </main>
    </div>
  );
}
