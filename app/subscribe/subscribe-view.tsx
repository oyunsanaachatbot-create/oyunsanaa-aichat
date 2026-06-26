"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast";
import type { SubscriptionStatus } from "@/lib/subscription/config";

type Props = {
  status: SubscriptionStatus;
  hasAccess: boolean;
  inTrial: boolean;
  daysLeft: number;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  priceMnt: number;
  priceUsd: number;
  qpayConfigured: boolean;
};

type Invoice = {
  senderInvoiceNo: string;
  qrImage: string;
  qrText: string;
  urls: Array<{ name: string; description: string; link: string }>;
  amount: number;
};

const fmtMnt = (n: number) => `${n.toLocaleString("en-US")}₮`;
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("mn-MN") : "";

export function SubscribeView({
  status,
  hasAccess,
  inTrial,
  daysLeft,
  trialEndsAt,
  currentPeriodEnd,
  priceMnt,
  priceUsd,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // TEMPORARY: QPay checkout is disabled — this button directly extends the
  // subscription by one period via /api/subscription/activate. Swap back to
  // `createInvoice` (kept below) once QPay is configured and live.
  const activate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/activate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          type: "error",
          description: data?.cause || data?.message || "Идэвхжүүлж чадсангүй.",
        });
        return;
      }
      toast({ type: "success", description: "Багц идэвхжлээ!" });
      // Send the user back to the chat now that access is granted.
      router.push("/");
      router.refresh();
    } catch {
      toast({ type: "error", description: "Сүлжээний алдаа гарлаа." });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Kept for when QPay is re-enabled: creates a real QPay invoice + QR.
  const createInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/invoice", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          type: "error",
          description: data?.cause || data?.message || "Нэхэмжлэх үүсгэж чадсангүй.",
        });
        return;
      }
      const data = (await res.json()) as Invoice;
      setInvoice(data);
    } catch {
      toast({ type: "error", description: "Сүлжээний алдаа гарлаа." });
    } finally {
      setLoading(false);
    }
  }, []);
  // Referenced to keep the QPay path from being flagged as unused while disabled.
  void createInvoice;

  // Poll for payment once an invoice exists.
  useEffect(() => {
    if (!invoice) return;
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/subscription/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderInvoiceNo: invoice.senderInvoiceNo }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { paid: boolean };
        if (data.paid) {
          stopPolling();
          toast({ type: "success", description: "Төлбөр амжилттай! Багц идэвхжлээ." });
          setTimeout(() => router.refresh(), 800);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return stopPolling;
  }, [invoice, router, stopPolling]);

  const statusLine =
    status === "active"
      ? `Багц идэвхтэй — ${fmtDate(currentPeriodEnd)} хүртэл`
      : inTrial
        ? `Үнэгүй туршилт — ${daysLeft} өдөр үлдсэн`
        : "Туршилтын хугацаа дууссан";

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="w-full rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="font-semibold text-2xl">Oyunsanaa Chat — Багц</h1>
        <p className="mt-1 text-muted-foreground text-sm">{statusLine}</p>

        {/* Subscription details */}
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3">
            <dt className="text-muted-foreground text-xs">Төлөв</dt>
            <dd className="mt-0.5 font-medium">
              {status === "active"
                ? "Идэвхтэй"
                : inTrial
                  ? "Үнэгүй туршилт"
                  : "Дууссан"}
            </dd>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <dt className="text-muted-foreground text-xs">Үлдсэн хоног</dt>
            <dd className="mt-0.5 font-medium">{daysLeft} өдөр</dd>
          </div>
          <div className="col-span-2 rounded-lg border bg-muted/30 p-3">
            <dt className="text-muted-foreground text-xs">
              {status === "active" ? "Дуусах огноо" : "Туршилт дуусах огноо"}
            </dt>
            <dd className="mt-0.5 font-medium">
              {status === "active"
                ? fmtDate(currentPeriodEnd)
                : fmtDate(trialEndsAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border bg-muted/40 p-5">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-3xl">{fmtMnt(priceMnt)}</span>
            <span className="text-muted-foreground text-sm">
              / сар (≈ ${priceUsd})
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>✓ AI чаттай хязгааргүй яриа</li>
            <li>✓ Бүх онол, аппликейшн нэг дор</li>
            <li>✓ Сар бүр сунгана</li>
          </ul>
        </div>

        {invoice ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-center text-sm text-muted-foreground">
              QR кодыг банкны аппаараа уншуулж {fmtMnt(invoice.amount)} төлнө үү.
              Төлбөр баталгаажмагц энэ хуудас автоматаар шинэчлэгдэнэ.
            </p>
            {/* biome-ignore lint/performance/noImgElement: base64 QR from QPay */}
            <img
              alt="QPay QR"
              className="size-56 rounded-lg border bg-white p-2"
              src={`data:image/png;base64,${invoice.qrImage}`}
            />
            {invoice.urls?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {invoice.urls.map((u) => (
                  <a
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                    href={u.link}
                    key={u.name}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {u.description || u.name}
                  </a>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">Төлбөр хүлээж байна…</p>
          </div>
        ) : (
          <Button
            className="mt-6 w-full"
            disabled={loading}
            onClick={activate}
            size="lg"
            variant={status === "active" ? "outline" : "default"}
          >
            {loading
              ? "Уншиж байна…"
              : status === "active"
                ? "Багц сунгах (+1 сар)"
                : "Багц идэвхжүүлэх"}
          </Button>
        )}

        {/* Temporary note while QPay checkout is disabled. */}
        <p className="mt-2 text-center text-muted-foreground text-xs">
          Түр зуур: QPay төлбөр идэвхгүй байгаа тул товч дарахад багц 1 сараар
          {status === "active" ? " нэмэгдэнэ." : " идэвхжинэ."}
        </p>

        {hasAccess && (
          <Button asChild className="mt-3 w-full" variant="ghost">
            <a href="/">Чат руу буцах</a>
          </Button>
        )}
      </div>
    </div>
  );
}
