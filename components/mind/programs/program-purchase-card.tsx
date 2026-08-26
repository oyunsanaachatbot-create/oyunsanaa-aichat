"use client";

import { Lock, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type Invoice = { senderInvoiceNo: string; qrText?: string; qrImage?: string | null; urls?: { name: string; link: string }[]; amount: number };

export function ProgramPurchaseCard({ slug, price }: { slug: string; price: number }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const verify = async (senderInvoiceNo?: string) => {
    setChecking(true);
    try {
      const response = await fetch(`/api/mind/programs/${encodeURIComponent(slug)}/purchase/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderInvoiceNo }) });
      const result = (await response.json()) as { paid?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Төлбөр шалгаж чадсангүй.");
      if (result.paid) window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Төлбөр шалгаж чадсангүй.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!invoice) return;
    const timer = window.setInterval(() => void verify(invoice.senderInvoiceNo), 5000);
    return () => window.clearInterval(timer);
  }, [invoice]);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/mind/programs/${encodeURIComponent(slug)}/purchase/invoice`, { method: "POST" });
      const result = (await response.json()) as Invoice & { paid?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Төлбөрийн нэхэмжлэл үүсгэж чадсангүй.");
      if (result.paid) window.location.reload();
      else setInvoice(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Төлбөрийн нэхэмжлэл үүсгэж чадсангүй.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-center shadow-sm">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Lock className="size-7" /></div>
      <h2 className="mt-4 font-bold text-xl">Төлбөртэй сургалт</h2>
      <p className="mt-2 text-slate-600 text-sm">Энэ сургалтыг үзэхийн тулд нэг удаа төлөөд lifetime эрх аваарай.</p>
      <p className="mt-4 font-extrabold text-2xl text-amber-800">{new Intl.NumberFormat("mn-MN").format(price)} ₮</p>
      {!invoice ? (
        <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 font-semibold text-sm text-white disabled:opacity-50" disabled={busy} onClick={() => void create()} type="button">
          {busy && <Loader2 className="size-4 animate-spin" />} QPay-аар худалдан авах
        </button>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4 text-left">
          {invoice.qrImage && <img alt="QPay QR" className="mx-auto size-48" src={invoice.qrImage.startsWith("data:") ? invoice.qrImage : `data:image/png;base64,${invoice.qrImage}`} />}
          <p className="font-semibold text-sm">QPay апп-аар QR код уншуулж төлнө үү.</p>
          {invoice.qrText && <p className="mt-2 break-all rounded-lg bg-slate-50 p-2 font-mono text-[10px] text-slate-500">{invoice.qrText}</p>}
          {invoice.urls?.map((url) => <a className="mt-2 block text-center font-semibold text-blue-700 text-sm" href={url.link} key={url.link} rel="noreferrer" target="_blank">{url.name} нээх</a>)}
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-sm" disabled={checking} onClick={() => void verify(invoice.senderInvoiceNo)} type="button"><RefreshCw className={checking ? "size-4 animate-spin" : "size-4"} /> Төлбөр шалгах</button>
        </div>
      )}
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
