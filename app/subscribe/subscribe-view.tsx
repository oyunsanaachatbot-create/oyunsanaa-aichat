"use client";

import Image from "next/image";
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
  qpayConfigured: boolean;
};

type Invoice = {
  senderInvoiceNo: string;
  qrImage: string | null;
  qrText: string;
  urls: Array<{
    name: string;
    description?: string;
    logo?: string;
    link: string;
  }>;
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
  qpayConfigured,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const cancelPayment = useCallback(async () => {
    if (!invoice || canceling) return;
    setCanceling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderInvoiceNo: invoice.senderInvoiceNo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.paid) {
          stopPolling();
          toast({
            type: "success",
            description: "Төлбөр амжилттай! Эрх идэвхжлээ.",
          });
          router.push("/");
          router.refresh();
          return;
        }
        toast({
          type: "error",
          description:
            data?.cause || data?.message || "Төлбөрийг цуцалж чадсангүй.",
        });
        return;
      }
      stopPolling();
      setInvoice(null);
      toast({ type: "success", description: "Төлбөр цуцлагдлаа." });
    } catch {
      toast({ type: "error", description: "Сүлжээний алдаа гарлаа." });
    } finally {
      setCanceling(false);
    }
  }, [canceling, invoice, router, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  const createInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/invoice", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          type: "error",
          description:
            data?.cause || data?.message || "Нэхэмжлэх үүсгэж чадсангүй.",
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
          toast({
            type: "success",
            description: "Төлбөр амжилттай! Эрх идэвхжлээ.",
          });
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 800);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return stopPolling;
  }, [invoice, router, stopPolling]);

  const statusLine =
    status === "active"
      ? `Эрх идэвхтэй — ${fmtDate(currentPeriodEnd)} хүртэл`
      : inTrial
        ? `Үнэгүй туршилт — ${daysLeft} өдөр үлдсэн`
        : "Туршилтын хугацаа дууссан";

  return (
    <div className="mx-auto min-h-dvh max-w-xl sm:px-4 sm:py-10">
      <div className="min-h-dvh w-full bg-card text-card-foreground sm:min-h-0 sm:rounded-2xl sm:border sm:shadow-sm">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur sm:rounded-t-2xl sm:px-6">
          <a className="flex min-w-0 items-center gap-2.5" href="/">
            <Image
              alt=""
              className="size-9 shrink-0"
              height={36}
              priority
              src="/icon-192.png"
              width={36}
            />
            <span className="truncate font-semibold">Oyunsanaa</span>
          </a>
          {invoice ? (
            <Button
              disabled={canceling}
              onClick={cancelPayment}
              size="sm"
              type="button"
              variant="outline"
            >
              {canceling ? "Цуцалж байна…" : "Төлбөр цуцлах"}
            </Button>
          ) : null}
        </header>

        <main className="p-4 pb-8 sm:p-6">
          <h1 className="font-semibold text-2xl">Oyunsanaa Chat — Эрх</h1>
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
              <span className="text-muted-foreground text-sm">/ сар</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✓ AI чаттай хязгааргүй яриа</li>
              <li>✓ Бүх онол, аппликейшн нэг дор</li>
            </ul>
          </div>

          {invoice ? (
            <div className="mt-6 flex flex-col items-center gap-4">
              <p className="text-center text-muted-foreground text-sm">
                QR кодыг банкны аппаараа уншуулж {fmtMnt(invoice.amount)} төлнө
                үү. Төлбөр баталгаажмагц энэ хуудас автоматаар шинэчлэгдэнэ.
              </p>
              {invoice.qrImage && (
                // biome-ignore lint/performance/noImgElement: base64 QR from QPay
                <img
                  alt="QPay QR"
                  className="size-56 rounded-lg border bg-white p-2"
                  height={224}
                  src={
                    invoice.qrImage.startsWith("data:")
                      ? invoice.qrImage
                      : `data:image/png;base64,${invoice.qrImage}`
                  }
                  width={224}
                />
              )}
              {invoice.urls?.length > 0 && (
                <div className="grid w-full grid-cols-2 gap-2">
                  {invoice.urls.map((u) => (
                    <a
                      className="flex min-h-14 items-center gap-2 rounded-xl border bg-background p-2.5 text-left text-xs shadow-sm transition-colors hover:bg-accent"
                      href={u.link}
                      key={`${u.name}-${u.link}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted font-semibold">
                        {u.logo ? (
                          // biome-ignore lint/performance/noImgElement: dynamic bank logo supplied by QPay
                          <img
                            alt=""
                            className="size-full object-contain p-1"
                            height={36}
                            loading="lazy"
                            src={u.logo}
                            width={36}
                          />
                        ) : (
                          u.name.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <span className="line-clamp-2 font-medium leading-tight">
                        {u.description || u.name}
                      </span>
                    </a>
                  ))}
                </div>
              )}
              <p className="text-muted-foreground text-xs">
                Төлбөр хүлээж байна…
              </p>
            </div>
          ) : (
            <Button
              className="mt-6 w-full"
              disabled={loading || !qpayConfigured}
              onClick={createInvoice}
              size="lg"
              variant={status === "active" ? "outline" : "default"}
            >
              {loading
                ? "Уншиж байна…"
                : status === "active"
                  ? "Эрх сунгах (+1 сар)"
                  : "Эрх идэвхжүүлэх"}
            </Button>
          )}

          <p className="mt-2 text-center text-muted-foreground text-xs">
            {qpayConfigured
              ? "QPay төлбөр баталгаажмагц эрх автоматаар 30 хоногоор сунгагдана."
              : "QPay тохиргоо хийгдээгүй байна. Админтай холбогдоно уу."}
          </p>

          {hasAccess && (
            <Button asChild className="mt-3 w-full" variant="ghost">
              <a href="/">Чат руу буцах</a>
            </Button>
          )}
        </main>
      </div>
    </div>
  );
}
