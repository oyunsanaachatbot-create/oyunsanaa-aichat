import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SubscribeDialog } from "@/components/subscribe-dialog";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { ClientErrorReporter } from "@/components/observability/client-error-reporter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  ensureUserIdByEmail,
  getUserRoleById,
  getUserSubscription,
} from "@/lib/db/queries";
import { resolveSubscription } from "@/lib/subscription/access";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <ClientErrorReporter />
        <Suspense fallback={<div className="flex h-dvh" />}>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Suspense>
      </DataStreamProvider>
    </>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  let isAdmin = false;

  if (session?.user?.email && session.user.type !== "guest") {
    const userId = await ensureUserIdByEmail(session.user.email);
    const [subscription, role] = await Promise.all([
      getUserSubscription(userId),
      getUserRoleById(userId),
    ]);
    const state = resolveSubscription(
      subscription ?? {
        trialStartedAt: new Date(),
        subscriptionStatus: "trialing",
        currentPeriodEnd: null,
      }
    );
    isAdmin = role === "ADMIN";

    if (!isAdmin && !state.hasAccess) redirect("/subscribe");
  }

  // cookie байхгүй үед default-оор нээлттэй байлгах
  const cookieVal = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = cookieVal ? cookieVal === "true" : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {/* ✅ заавал flex wrapper хэрэгтэй */}
      <div className="flex min-h-dvh w-full">
        <AppSidebar isAdmin={isAdmin} user={session?.user} />
        <SidebarInset className="min-w-0 flex-1">
          <SubscriptionBanner />
          {children}
        </SidebarInset>
      </div>
      <SubscribeDialog />
    </SidebarProvider>
  );
}
