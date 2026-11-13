"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import useSWR from "swr";
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

  const { data: profile } = useSWR<{ user: { id: string; avatarPath: string | null } | null }>(
    status === "authenticated" && !isGuest && user.id ? ["/api/me", user.id] : null,
    async ([url]: [string, string]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Profile unavailable");
      return response.json();
    },
  );
  const profileUser = profile?.user;
  const avatarUrl = profileUser?.avatarPath && profileUser.id === user.id
    ? `${dashboardOrigin.replace(/\/$/, "")}${profileUser.avatarPath}`
    : null;
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();

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
                {avatarUrl && avatarUrl !== failedAvatar ? (
                  <Image
                    alt=""
                    className="size-6 rounded-full object-cover"
                    height={24}
                    onError={() => setFailedAvatar(avatarUrl)}
                    src={avatarUrl}
                    unoptimized
                    width={24}
                  />
                ) : (
                  <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-semibold">
                    {initial}
                  </span>
                )}

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
