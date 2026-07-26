"use client";

import useSWR from "swr";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSubscribeDialog } from "@/hooks/use-subscribe-dialog";
import { useT } from "@/lib/i18n/provider";

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
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSWR<Status>("/api/subscription/status", fetcher, {
    revalidateOnFocus: false,
  });
  const { openSubscribeDialog } = useSubscribeDialog();
  const t = useT();

  // The shared (chat) layout stays mounted during client-side navigation.
  // Redirect here as well so an expired user cannot open another module from
  // the sidebar without a full page reload.
  useEffect(() => {
    if (data && !data.hasAccess && pathname !== "/subscribe") {
      router.replace("/subscribe");
    }
  }, [data, pathname, router]);

  if (!data) return null;
  if (data.status === "active") return null;

  const expired = !data.hasAccess;

  return (
    <button
      className={`block w-full px-4 py-2 text-center font-medium text-xs transition-colors ${
        expired
          ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
          : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400"
      }`}
      onClick={openSubscribeDialog}
      type="button"
    >
      {expired
        ? t.banner.trialExpired
        : t.banner.trialDaysLeft.replace("{days}", String(data.daysLeft))}
    </button>
  );
}
