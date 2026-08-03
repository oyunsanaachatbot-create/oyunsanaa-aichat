"use client";

import { usePathname } from "next/navigation";

import { SubscriptionBanner } from "@/components/subscription-banner";

export function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/" || pathname.startsWith("/chat/");

  if (!isChatRoute) {
    return (
      <>
        <SubscriptionBanner />
        {children}
      </>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
      <SubscriptionBanner />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
