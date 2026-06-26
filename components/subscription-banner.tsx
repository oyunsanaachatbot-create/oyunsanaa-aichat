"use client";

import useSWR from "swr";
import { useSubscribeDialog } from "@/hooks/use-subscribe-dialog";

type Status = {
  status: "trialing" | "active" | "expired";
  hasAccess: boolean;
  inTrial: boolean;
  daysLeft: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Slim banner shown above the chat while the user is on the free trial or once
 * it has expired. Hidden for users with an active paid subscription.
 */
export function SubscriptionBanner() {
  const { data } = useSWR<Status>("/api/subscription/status", fetcher, {
    revalidateOnFocus: false,
  });
  const { openSubscribeDialog } = useSubscribeDialog();

  if (!data) return null;
  if (data.status === "active") return null;

  const expired = !data.hasAccess;

  return (
    <button
      className={`block w-full px-4 py-2 text-center text-xs font-medium transition-colors ${
        expired
          ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
          : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
      }`}
      onClick={openSubscribeDialog}
      type="button"
    >
      {expired
        ? "Үнэгүй туршилт дууссан. Үргэлжлүүлэхийн тулд багц идэвхжүүлнэ үү →"
        : `Үнэгүй туршилт — ${data.daysLeft} өдөр үлдсэн. Багц идэвхжүүлэх →`}
    </button>
  );
}
