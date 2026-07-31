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
  qpayConfigured: boolean;
};

type Invoice = {
  senderInvoiceNo: string;
  qrImage: string | null;
  qrText: string;
  urls: Array<{ name: string; description?: string; link: string }>;
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
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

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
            description: "Төлбөр амжилттай! Эрх сунгагдлаа.",
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
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="w-full rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="font-semibold text-2xl">Oyunsanaa Chat — Эрх сунгалт</h1>
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
              / 30 хоногийн эрх
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>✓ AI чаттай хязгааргүй яриа</li>
            <li>✓ Бүх онол, аппликейшн нэг дор</li>
            <li>✓ Төлбөр баталгаажмагц 30 хоногоор сунгана</li>
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
                src={`data:image/png;base64,${invoice.qrImage}`}
                width={224}
              />
            )}
            {invoice.urls?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {invoice.urls.map((u) => (
                  <a
                    className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                    href={u.link}
                    key={`${u.name}-${u.link}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {u.description || u.name}
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
                ? "Эрх сунгах (+30 хоног)"
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
      </div>
    </div>
  );
}
