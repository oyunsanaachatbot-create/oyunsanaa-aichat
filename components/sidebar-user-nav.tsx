"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSubscribeDialog } from "@/hooks/use-subscribe-dialog";
import { guestRegex } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { openSubscribeDialog } = useSubscribeDialog();
  const t = useT();
  // Set NEXT_PUBLIC_DASHBOARD_URL to the website testing origin on testing deployments.
  // The website itself resolves /dashboard to the authenticated user\u0027s role-specific view.
  const [dashboardOrigin, setDashboardOrigin] = useState(process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.NEXT_PUBLIC_MARKETING_URL || "https://oyunsanaa.com");
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_DASHBOARD_URL && window.location.port === "8082") {
      setDashboardOrigin(`${window.location.protocol}//${window.location.hostname}:8081`);
    }
  }, []);
  const dashboardHref = `${dashboardOrigin.replace(/\/$/, "")}/dashboard`;

  const isGuest =
    (data?.user as any)?.type === "guest" ||
    guestRegex.test(data?.user?.email ?? "");

  // ✅ зөв байрлал: return-оос өмнө, function дотор
  const email = user?.email ?? "guest";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random&size=24`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === "loading" ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    {t.common.loadingAuthStatus}
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Image
                  alt={user.email ?? "User Avatar"}
                  className="rounded-full"
                  height={24}
                  src={avatarUrl}
                  width={24}
                />

                <span className="truncate" data-testid="user-email">
                  {isGuest ? "Guest" : user?.email}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            {!isGuest && (
              <>
                <DropdownMenuItem asChild className="cursor-pointer" data-testid="user-nav-item-dashboard">
                  <Link href={dashboardHref} target="_blank" rel="noopener noreferrer">
                    Миний хянах самбар
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  data-testid="user-nav-item-subscription"
                  onSelect={openSubscribeDialog}
                >
                  {t.common.subscription}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "light"
                ? t.common.toggleToDarkMode
                : t.common.toggleToLightMode}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-auth"
              onSelect={async (e) => {
                e.preventDefault();

                if (status === "loading") {
                  toast({
                    type: "error",
                    description: t.common.checkingAuthStatus,
                  });
                  return;
                }

                if (isGuest) {
                  router.push("/login");
                  return;
                }

                await signOut({
                  redirect: true,
                  callbackUrl: `${window.location.origin}/login?signedOut=1`,
                });
              }}
            >
              {isGuest ? t.common.loginToAccount : t.common.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
