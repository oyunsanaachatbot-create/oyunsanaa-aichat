"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";

export default function BalanceProgressPage() {
  const t = useT();
  const b = t.apps.balance.progressPage;

  return (
    <div className="min-h-screen bg-white text-slate-900 grid place-items-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h1 className="text-lg font-semibold">{b.title}</h1>
        <p className="text-sm text-slate-700">
          {b.text}
        </p>
        <div className="flex gap-3">
          <Link className="underline" href="/mind/balance/test">{b.toTest}</Link>
          <Link className="underline" href="/mind/balance/result">{b.toResult}</Link>
        </div>
      </div>
    </div>
  );
}
