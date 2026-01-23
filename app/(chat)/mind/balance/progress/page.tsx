"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, History } from "lucide-react";
import { useRouter } from "next/navigation";

type Attempt = {
  id: string;
  createdAt: string;
  total: number;
};

const STORAGE_KEY = "oyunsanaa_balance_attempts";

export default function BalanceProgressPage() {
  const router = useRouter();
  const [items, setItems] = useState<Attempt[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    setItems(arr);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-50 bg-gradient-to-b from-[#04101f] via-[#071a33] to-[#020816]">
      <main className="relative z-10 px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/25 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <div className="rounded-2xl border border-white/20 bg-[#1F6FB2]/25 backdrop-blur px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/25">
                <History className="h-4 w-4" />
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold text-white">Явц (лог)</h1>
            </div>
            <p className="mt-2 text-sm text-white/85">
              Энд өмнөх тестүүдийн товч түүх хадгалагдана.
            </p>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-white/80">
                Одоогоор лог алга.{" "}
                <Link className="underline" href="/mind/balance/test">
                  Тест бөглөх
                </Link>
              </div>
            ) : (
              items.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/90 font-semibold">
                      Нийт үнэлгээ: {a.total}/100
                    </div>
                    <div className="text-xs text-white/70">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/mind/balance/results"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Сүүлийн үр дүн харах
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
