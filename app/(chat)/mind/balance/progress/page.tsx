import Link from "next/link";

export default function BalanceProgressPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 grid place-items-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h1 className="text-lg font-semibold">Нэгдсэн явц (Dashboard)</h1>
        <p className="text-sm text-slate-700">
          Энэ хуудас нь доод аппуудын нэгдсэн явцад зориулагдсан. Balance тестийн явц/график нь тестийн “Дүгнэлт” дээр гарна.
        </p>
        <div className="flex gap-3">
          <Link className="underline" href="/mind/balance/test">Тест рүү</Link>
          <Link className="underline" href="/mind/balance/result">Тестийн дүгнэлт рүү</Link>
        </div>
      </div>
    </div>
  );
}
