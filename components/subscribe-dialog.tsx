"use client";

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
  priceUsd: number;
};

type Invoice = {
  senderInvoiceNo: string;
  qrImage: string;
  qrText: string;
  urls: Array<{ name: string; description: string; link: string }>;
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

  const [activating, setActivating] = useState(false);
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

  // TEMPORARY: QPay checkout is disabled — this button directly extends the
  // subscription by one period via /api/subscription/activate.
  const activate = useCallback(async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/subscription/activate", { method: "POST" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast({
          type: "error",
          description: errData?.cause || errData?.message || "Идэвхжүүлж чадсангүй.",
        });
        return;
      }
      toast({ type: "success", description: "Багц идэвхжлээ!" });
      closeSubscribeDialog();
      router.refresh();
    } catch {
      toast({ type: "error", description: "Сүлжээний алдаа гарлаа." });
    } finally {
      setActivating(false);
    }
  }, [router, closeSubscribeDialog]);

  // Poll for payment once an invoice exists (kept for when QPay is re-enabled).
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
          toast({ type: "success", description: "Төлбөр амжилттай! Багц идэвхжлээ." });
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
      ? `Багц идэвхтэй — ${fmtDate(data.currentPeriodEnd)} хүртэл`
      : data.inTrial
        ? `Үнэгүй туршилт — ${data.daysLeft} өдөр үлдсэн`
        : "Туршилтын хугацаа дууссан"
    : "";

  return (
    <Dialog
      onOpenChange={(open) => !open && closeSubscribeDialog()}
      open={isOpen}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Oyunsanaa Chat — Багц</DialogTitle>
        </DialogHeader>

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
                <dt className="text-muted-foreground text-xs">Үлдсэн хоног</dt>
                <dd className="mt-0.5 font-medium">{data.daysLeft} өдөр</dd>
              </div>
              <div className="col-span-2 rounded-lg border bg-muted/30 p-3">
                <dt className="text-muted-foreground text-xs">
                  {data.status === "active" ? "Дуусах огноо" : "Туршилт дуусах огноо"}
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
                <span className="font-bold text-2xl">{fmtMnt(data.priceMnt)}</span>
                <span className="text-muted-foreground text-sm">
                  / сар (≈ ${data.priceUsd})
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>✓ AI чаттай хязгааргүй яриа</li>
                <li>✓ Бүх онол, аппликейшн нэг дор</li>
                <li>✓ Сар бүр сунгана</li>
              </ul>
            </div>

            {invoice ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className="text-center text-muted-foreground text-sm">
                  QR кодыг банкны аппаараа уншуулж {fmtMnt(invoice.amount)} төлнө үү.
                </p>
                {/* biome-ignore lint/performance/noImgElement: base64 QR from QPay */}
                <img
                  alt="QPay QR"
                  className="size-48 rounded-lg border bg-white p-2"
                  src={`data:image/png;base64,${invoice.qrImage}`}
                />
                <p className="text-muted-foreground text-xs">Төлбөр хүлээж байна…</p>
              </div>
            ) : (
              <Button
                className="mt-4 w-full"
                disabled={activating}
                onClick={activate}
                size="lg"
                variant={data.status === "active" ? "outline" : "default"}
              >
                {activating
                  ? "Уншиж байна…"
                  : data.status === "active"
                    ? "Багц сунгах (+1 сар)"
                    : "Багц идэвхжүүлэх"}
              </Button>
            )}

            <p className="mt-2 text-center text-muted-foreground text-xs">
              Түр зуур: QPay төлбөр идэвхгүй байгаа тул товч дарахад багц 1 сараар
              {data.status === "active" ? " нэмэгдэнэ." : " идэвхжинэ."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
