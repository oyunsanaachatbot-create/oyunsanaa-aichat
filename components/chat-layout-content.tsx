"use client";

import { usePathname } from "next/navigation";

import { SubscriptionBanner } from "@/components/subscription-banner";
import { ContentUsageTracker } from "@/components/content-usage-tracker";

const RELATION_TEST_PATH = /^\/mind\/relations\/tests\/([^/]+)$/;

function trackedContentKey(pathname: string) {
  if (pathname.startsWith("/mind/ebooks")) return "static:note";
  if (pathname.startsWith("/mind/life/finance-app")) return "static:finance";
  if (
    pathname.startsWith("/mind/self-care/health") ||
    pathname.startsWith("/mind/health-demo")
  )
    return "static:health";
  if (pathname.startsWith("/mind/online-psychologist"))
    return "static:specialist";
  const test = pathname.match(RELATION_TEST_PATH);
  return test?.[1] ? `static:test:${test[1]}` : null;
}

export function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/" || pathname.startsWith("/chat/");
  const contentKey = trackedContentKey(pathname);

  if (!isChatRoute) {
    return (
      <>
        <ContentUsageTracker externalKey={contentKey} />
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
