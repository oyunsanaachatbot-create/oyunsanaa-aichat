"use client";

import {
  CheckCircle2,
  LockKeyhole,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Invoice = {
  senderInvoiceNo: string;
  qrText?: string;
  qrImage?: string | null;
  urls?: { name: string; link: string }[];
  amount: number;
};

export function ProgramPurchaseCard({
  slug,
  price,
}: {
  slug: string;
  price: number;
}) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const verify = useCallback(
    async (senderInvoiceNo?: string) => {
      setChecking(true);
      try {
        const response = await fetch(
          `/api/mind/programs/${encodeURIComponent(slug)}/purchase/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderInvoiceNo }),
          }
        );
        const result = (await response.json()) as {
          paid?: boolean;
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error ?? "Төлбөр шалгаж чадсангүй.");
        if (result.paid) window.location.reload();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Төлбөр шалгаж чадсангүй."
        );
      } finally {
        setChecking(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (!invoice) return;
    const timer = window.setInterval(
      () => verify(invoice.senderInvoiceNo),
      5000
    );
    return () => window.clearInterval(timer);
  }, [invoice, verify]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/mind/programs/${encodeURIComponent(slug)}/purchase/invoice`,
        { method: "POST" }
      );
      const result = (await response.json()) as Invoice & {
        paid?: boolean;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          result.error ?? "Төлбөрийн нэхэмжлэл үүсгэж чадсангүй."
        );
      if (result.paid) window.location.reload();
      else setInvoice(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Төлбөрийн нэхэмжлэл үүсгэж чадсангүй."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#123B67] via-[#1F6FB2] to-[#3A8CC8] px-6 py-7 text-center text-white">
        <div className="-top-20 -right-16 pointer-events-none absolute size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto grid size-16 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur">
          <LockKeyhole className="size-8" />
        </div>
        <p className="relative mt-4 font-bold text-blue-100 text-sm">
          ОНЦГОЙ АГУУЛГА
        </p>
        <h2 className="relative mt-1 font-extrabold text-2xl tracking-tight">
          Төлбөртэй сургалт
        </h2>
        <p className="relative mt-2 text-blue-100 text-sm">
          Нэг удаа төлөөд сургалтаа lifetime эрхээр үзээрэй.
        </p>
      </div>
      <div className="p-6 text-center sm:p-7">
        <p className="font-extrabold text-3xl text-slate-900">
          {new Intl.NumberFormat("mn-MN").format(price)}{" "}
          <span className="text-[#1F6FB2] text-xl">₮</span>
        </p>
        <div className="mx-auto mt-4 grid max-w-sm gap-2 text-left text-slate-600 text-sm sm:grid-cols-3 sm:text-xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />{" "}
            Lifetime эрх
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> Бүх
            видео
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 shrink-0 text-emerald-500" /> QPay
            хамгаалалт
          </span>
        </div>
        {!invoice ? (
          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F6FB2] px-5 py-3.5 font-bold text-sm text-white shadow-[0_8px_20px_rgba(31,111,178,0.25)] transition hover:bg-[#185B93] disabled:opacity-50"
            disabled={busy}
            onClick={create}
            type="button"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <QrCode className="size-4" />
            )}{" "}
            QPay-аар төлөх
          </button>
        ) : (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-left">
            <div className="mb-3 flex items-center gap-2 font-bold text-[#123B67] text-sm">
              <QrCode className="size-4" /> QPay төлбөрийн QR
            </div>
            {invoice.qrImage && (
              <div className="mx-auto w-fit rounded-2xl border border-white bg-white p-3 shadow-sm">
                <Image
                  alt="QPay QR"
                  className="size-48"
                  height={192}
                  src={
                    invoice.qrImage.startsWith("data:")
                      ? invoice.qrImage
                      : `data:image/png;base64,${invoice.qrImage}`
                  }
                  unoptimized
                  width={192}
                />
              </div>
            )}
            <p className="mt-3 font-semibold text-slate-700 text-sm">
              QPay апп-аар QR код уншуулж төлнө үү.
            </p>
            {invoice.qrText && (
              <p className="mt-2 break-all rounded-lg bg-slate-50 p-2 font-mono text-[10px] text-slate-500">
                {invoice.qrText}
              </p>
            )}
            {invoice.urls?.map((url) => (
              <a
                className="mt-2 block text-center font-semibold text-blue-700 text-sm"
                href={url.link}
                key={url.link}
                rel="noreferrer"
                target="_blank"
              >
                {url.name} нээх
              </a>
            ))}
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 font-bold text-[#1F6FB2] text-sm transition hover:bg-blue-50"
              disabled={checking}
              onClick={() => verify(invoice.senderInvoiceNo)}
              type="button"
            >
              <RefreshCw
                className={checking ? "size-4 animate-spin" : "size-4"}
              />{" "}
              Төлбөр шалгах
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
