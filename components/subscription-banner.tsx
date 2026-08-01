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

const fetcher = async (url: string): Promise<Status> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Subscription status request failed (${response.status})`);
  }
  return response.json() as Promise<Status>;
};

/**
 * Slim banner shown above the chat while the user is on the free trial or once
 * it has expired. Hidden for users with an active paid subscription.
 */
export function SubscriptionBanner() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isValidating, mutate } = useSWR<Status>(
    "/api/subscription/status",
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
    }
  );
  const { openSubscribeDialog } = useSubscribeDialog();
  const t = useT();

  // The shared layout can survive client-side navigation, so confirm access
  // from the server for each path. Never redirect from cached SWR data: an
  // "expired" value can remain cached immediately after a successful payment.
  // Failed status requests must also fail open here; protected APIs and the
  // server layout remain the authoritative gates.
  useEffect(() => {
    if (pathname === "/subscribe") return;

    let cancelled = false;
    const confirmAccess = async () => {
      try {
        const fresh = await mutate();
        if (!(cancelled || !fresh) && fresh.hasAccess === false) {
          router.replace("/subscribe");
        }
      } catch {
        // A transient status error must not send a paid user to the paywall.
      }
    };
    confirmAccess().catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [mutate, pathname, router]);

  if (!data || isValidating) return null;
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
