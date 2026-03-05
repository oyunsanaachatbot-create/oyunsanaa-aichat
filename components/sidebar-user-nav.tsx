"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { guestRegex } from "@/lib/constants";

/**
 * Only-Supabase migration NOTE:
 * - NextAuth useSession/signOut-ыг бүрэн авлаа (app унагааж байсан).
 * - Одоогоор "user" prop дээр тулгуурлаад UI-г ажиллуулна.
 * - Дараа нь Supabase session бэлэн болмогц:
 *   - user prop-ыг Supabase user-аас өгдөг болгоно
 *   - "Sign out" дээр supabase.auth.signOut() дуудна
 */

type SidebarUser = {
  email?: string | null;
};

export function SidebarUserNav({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  // NextAuth session байхгүй тул guest-ийг зөвхөн email-аар шийднэ (түр)
  const email = user?.email ?? "guest";
  const isGuest = guestRegex.test(email);

  const avatarUrl = `https://avatar.vercel.sh/${encodeURIComponent(email)}.png`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-nav-button"
            >
              <Image
                alt={email ?? "User Avatar"}
                className="rounded-full"
                height={24}
                src={avatarUrl}
                width={24}
              />

              <span className="truncate" data-testid="user-email">
                {isGuest ? "Guest" : email}
              </span>
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-auth"
              onSelect={(e) => {
                e.preventDefault();

                if (isGuest) {
                  router.push("/login");
                  return;
                }

                // Only-Supabase: одоохондоо logout нь /login руу чиглүүлнэ.
                // Дараа Supabase logout нэмэхдээ энд:
                // await supabaseBrowser().auth.signOut();
                router.push("/login?signedOut=1");
              }}
            >
              {isGuest ? "Login to your account" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
