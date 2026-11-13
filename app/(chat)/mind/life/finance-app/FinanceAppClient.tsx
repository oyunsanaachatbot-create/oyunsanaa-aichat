"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/mind/app-shell";
import { categoryLabels, subLabel } from "./financeCategories";
import { useTransactions } from "./useTransactions";
import { ReportSection } from "./ReportSection";
import { EntrySection } from "./EntrySection";
import { ReceiptUploadSection } from "./ReceiptUploadSection";
import { useLocale, useT } from "@/lib/i18n/provider";

type Props = { userId: string };

export default function FinanceAppClient({ userId }: Props) {
  const router = useRouter();
  const t = useT();
  const f = t.apps.finance;
  const locale = useLocale();
  const labels = categoryLabels(locale);
  const {
    guest,
    loading,
    transactions,
    totals,
    addTransaction,
    deleteTransaction,
    deleteAll,
  } = useTransactions(userId);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("receipt") === "1") {
      setReceiptOpen(true);
    }
  }, []);

  const closeReceipt = () => {
    setReceiptOpen(false);
    router.replace("/mind/life/finance-app", { scroll: false });
  };

  return (
    <AppShell
      title={f.title}
      subtitle={f.subtitle}
      width="4xl"
    >
      <div className="space-y-6 text-slate-900">
        <section className="space-y-2">
          {loading && <div className="text-[11px] text-slate-500">{f.loading}</div>}

          {!loading && guest && (
            <div className="text-[11px] text-amber-700" dangerouslySetInnerHTML={{ __html: f.guestModeNotice }} />
          )}

          <p className="text-[11px] sm:text-xs text-slate-600">
            {f.totalIncome}:{" "}
            <span className="text-emerald-600 font-semibold">{totals.totalIncome.toLocaleString("mn-MN")} ₮</span>{" "}
            · {f.totalExpense}:{" "}
            <span className="text-rose-600 font-semibold">{totals.totalExpense.toLocaleString("mn-MN")} ₮</span>{" "}
            · {f.balance}:{" "}
            <span className={`font-semibold ${totals.balance >= 0 ? "text-sky-600" : "text-amber-600"}`}>
              {totals.balance.toLocaleString("mn-MN")} ₮
            </span>{" "}
            · {f.debtOutstanding}:{" "}
            <span className="text-amber-600 font-semibold">{totals.debtOutstanding.toLocaleString("mn-MN")} ₮</span>
          </p>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{f.receipt.title}</h3>
              <p className="mt-1 text-[11px] text-slate-500">{f.receipt.description}</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 font-medium text-white text-xs shadow-sm transition hover:bg-sky-600"
              onClick={() => setReceiptOpen(true)}
              type="button"
            >
              <Camera className="h-4 w-4" />
              {f.receipt.uploadBtn}
            </button>
          </div>
        </section>

        {receiptOpen && (
          <ReceiptUploadSection
            modal
            onAdd={addTransaction}
            onClose={closeReceipt}
          />
        )}

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
          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-900">{f.recentTransactions}</h3>

            {transactions.length === 0 ? (
              <p className="text-[12px] text-slate-500">{f.noTransactions}</p>
            ) : (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {transactions.map((tx) => {
                  const isPlus =
                    tx.type === "income" ||
                    tx.category === "debt_borrow" ||
                    tx.category === "saving_add";
                  const typeLabel =
                    tx.type === "income"
                      ? f.typeLabel.income
                      : tx.type === "debt"
                        ? f.typeLabel.debt
                        : tx.type === "saving"
                          ? f.typeLabel.saving
                          : f.typeLabel.expense;
                  const sub = tx.subCategory ? subLabel(tx.subCategory, locale) : "";

                  return (
                    <div key={tx.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={isPlus ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                            {isPlus ? "+ " : "- "}
                            {tx.amount.toLocaleString("mn-MN")} ₮
                          </span>

                          <span className="text-[11px] text-slate-500">
                            {typeLabel} · {labels[tx.category]}
                          </span>

                          {sub && (
                            <span className="text-[10px] text-slate-600 border border-slate-200 bg-white px-2 py-0.5 rounded-full">
                              {sub}
                            </span>
                          )}
                        </div>

                        {tx.note && <p className="text-[11px] text-slate-700">{tx.note}</p>}

                        <p className="text-[10px] text-slate-500">
                          {tx.date} ·{" "}
                          {tx.source === "text"
                            ? f.sourceLabel.text
                            : tx.source === "voice"
                            ? f.sourceLabel.voice
                            : tx.source === "receipt"
                            ? f.sourceLabel.receipt
                            : f.sourceLabel.image}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTransaction(tx.id)}
                        className="mt-1 text-slate-400 hover:text-rose-600 transition"
                        aria-label={f.deleteAria}
                        title={f.deleteTitle}
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
