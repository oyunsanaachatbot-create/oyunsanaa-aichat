"use client";

import { GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, LOCALE_COOKIE, localeNames, locales } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const current = useLocale();
  const [isPending, startTransition] = useTransition();

  const setLocale = (next: Locale) => {
    if (next === current) {
      return;
    }
    // One-year cookie; server layout reads it on the next render.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Re-render server components so the new dictionary flows through the provider.
    startTransition(() => router.refresh());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Change language"
          className={className}
          disabled={isPending}
          size="sm"
          variant="ghost"
        >
          <GlobeIcon className="size-4" />
          <span className="hidden sm:inline">{localeNames[current]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            className={loc === current ? "font-semibold" : undefined}
            key={loc}
            onSelect={() => setLocale(loc)}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
