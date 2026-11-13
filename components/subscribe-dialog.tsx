"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscribeDialog } from "@/hooks/use-subscribe-dialog";
import type { SubscriptionStatus } from "@/lib/subscription/config";

type Status = {
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const fmtMnt = (n: number) => `${n.toLocaleString("en-US")}₮`;
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("mn-MN") : "";

export function SubscribeDialog() {
  const { isOpen, closeSubscribeDialog } = useSubscribeDialog();
  const router = useRouter();
  const { data, isLoading } = useSWR<Status>(
    isOpen ? "/api/subscription/status" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

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

  useEffect(() => stopPolling, [stopPolling]);

  // Reset transient invoice state whenever the dialog is reopened.
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setInvoice(null);
    }
  }, [isOpen, stopPolling]);

  const cancelPayment = useCallback(async () => {
    if (!invoice || canceling) return;
    setCanceling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderInvoiceNo: invoice.senderInvoiceNo }),
      });
      const cancelData = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (cancelData?.paid) {
          stopPolling();
          toast({
            type: "success",
            description: "Төлбөр амжилттай! Эрх идэвхжлээ.",
          });
          closeSubscribeDialog();
          router.refresh();
          return;
        }
        toast({
          type: "error",
          description:
            cancelData?.cause ||
            cancelData?.message ||
            "Төлбөрийг цуцалж чадсангүй.",
        });
        return;
      }
      stopPolling();
      setInvoice(null);
      toast({ type: "success", description: "Төлбөр цуцлагдлаа." });
      closeSubscribeDialog();
    } catch {
      toast({ type: "error", description: "Сүлжээний алдаа гарлаа." });
    } finally {
      setCanceling(false);
    }
  }, [canceling, closeSubscribeDialog, invoice, router, stopPolling]);

  const createInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/invoice", { method: "POST" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast({
          type: "error",
          description:
            errData?.cause || errData?.message || "Нэхэмжлэх үүсгэж чадсангүй.",
        });
        return;
      }
      setInvoice((await res.json()) as Invoice);
    } catch {
      toast({ type: "error", description: "Сүлжээний алдаа гарлаа." });
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll our authenticated endpoint as a fallback for delayed callbacks and
  // local environments where QPay cannot reach the callback URL.
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
        const verifyData = (await res.json()) as { paid: boolean };
        if (verifyData.paid) {
          stopPolling();
          toast({
            type: "success",
            description: "Төлбөр амжилттай! Эрх идэвхжлээ.",
          });
          setTimeout(() => {
            closeSubscribeDialog();
            router.refresh();
          }, 800);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return stopPolling;
  }, [invoice, router, closeSubscribeDialog, stopPolling]);

  const statusLine = data
    ? data.status === "active"
      ? `Эрх идэвхтэй — ${fmtDate(data.currentPeriodEnd)} хүртэл`
      : data.inTrial
        ? `Үнэгүй туршилт — ${data.daysLeft} өдөр үлдсэн`
        : "Туршилтын хугацаа дууссан"
    : "";

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) return;
        if (invoice) {
          cancelPayment().catch(() => null);
          return;
        }
        closeSubscribeDialog();
      }}
      open={isOpen}
    >
      <DialogContent className="grid max-h-[calc(100dvh-1rem)] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)]">
        <DialogHeader className="flex-row items-center gap-2.5 border-b px-4 py-3 pr-12 text-left sm:px-5">
          <Image
            alt=""
            className="size-9 shrink-0"
            height={36}
            priority
            src="/icon-192.png"
            width={36}
          />
          <div>
            <p className="font-semibold text-sm">Oyunsanaa</p>
            <DialogTitle className="mt-0.5 text-base">Chat — Эрх</DialogTitle>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-4 sm:p-5">
          {isLoading || !data ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Уншиж байна…
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground text-sm">{statusLine}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <dt className="text-muted-foreground text-xs">Төлөв</dt>
                  <dd className="mt-0.5 font-medium">
                    {data.status === "active"
                      ? "Идэвхтэй"
                      : data.inTrial
                        ? "Үнэгүй туршилт"
                        : "Дууссан"}
                  </dd>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <dt className="text-muted-foreground text-xs">
                    Үлдсэн хоног
                  </dt>
                  <dd className="mt-0.5 font-medium">{data.daysLeft} өдөр</dd>
                </div>
                <div className="col-span-2 rounded-lg border bg-muted/30 p-3">
                  <dt className="text-muted-foreground text-xs">
                    {data.status === "active"
                      ? "Дуусах огноо"
                      : "Туршилт дуусах огноо"}
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {data.status === "active"
                      ? fmtDate(data.currentPeriodEnd)
                      : fmtDate(data.trialEndsAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-xl border bg-muted/40 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-2xl">
                    {fmtMnt(data.priceMnt)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ сар</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li>✓ AI чаттай хязгааргүй яриа</li>
                  <li>✓ Бүх онол, аппликейшн нэг дор</li>
                </ul>
              </div>

              {invoice ? (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <p className="text-center text-muted-foreground text-sm">
                    QR кодыг банкны аппаараа уншуулж {fmtMnt(invoice.amount)}{" "}
                    төлнө үү.
                  </p>
                  {invoice.qrImage && (
                    // biome-ignore lint/performance/noImgElement: base64 QR from QPay
                    <img
                      alt="QPay QR"
                      className="size-48 rounded-lg border bg-white p-2"
                      height={192}
                      src={
                        invoice.qrImage.startsWith("data:")
                          ? invoice.qrImage
                          : `data:image/png;base64,${invoice.qrImage}`
                      }
                      width={192}
                    />
                  )}
                  {invoice.urls.length > 0 && (
                    <div className="grid w-full grid-cols-2 gap-2">
                      {invoice.urls.map((url) => (
                        <a
                          className="flex min-h-14 items-center gap-2 rounded-xl border bg-background p-2.5 text-left text-xs shadow-sm transition-colors hover:bg-accent"
                          href={url.link}
                          key={`${url.name}-${url.link}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted font-semibold">
                            {url.logo ? (
                              // biome-ignore lint/performance/noImgElement: dynamic bank logo supplied by QPay
                              <img
                                alt=""
                                className="size-full object-contain p-1"
                                height={36}
                                loading="lazy"
                                src={url.logo}
                                width={36}
                              />
                            ) : (
                              url.name.slice(0, 2).toUpperCase()
                            )}
                          </span>
                          <span className="line-clamp-2 font-medium leading-tight">
                            {url.description || url.name}
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
                  className="mt-4 w-full"
                  disabled={loading || !data.qpayConfigured}
                  onClick={createInvoice}
                  size="lg"
                  variant={data.status === "active" ? "outline" : "default"}
                >
                  {loading
                    ? "Уншиж байна…"
                    : data.status === "active"
                      ? "Эрх сунгах (+1 сар)"
                      : "Эрх идэвхжүүлэх"}
                </Button>
              )}

              <p className="mt-2 text-center text-muted-foreground text-xs">
                {data.qpayConfigured
                  ? "QPay төлбөр баталгаажмагц эрх автоматаар 30 хоногоор сунгагдана."
                  : "QPay тохиргоо хийгдээгүй байна. Админтай холбогдоно уу."}
              </p>
            </div>
          )}
        </div>

        {invoice ? (
          <div className="border-t bg-background p-3 sm:p-4">
            <Button
              className="w-full"
              disabled={canceling}
              onClick={cancelPayment}
              type="button"
              variant="outline"
            >
              {canceling ? "Цуцалж байна…" : "Төлбөр цуцлах"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
