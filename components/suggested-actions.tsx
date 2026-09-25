"use client";
import { ArrowUpRight } from "lucide-react";
import { chatCopy } from "@/lib/i18n/chat-copy";
import { useLocale } from "@/lib/i18n/provider";

export function SuggestedActions({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  const copy = chatCopy[useLocale()];
  return (
    <div className="grid gap-2.5" data-testid="suggested-actions">
      {copy.starters.map((text) => (
        <button
          className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 md:text-base"
          key={text}
          onClick={() => onSelect(text)}
          type="button"
        >
          {text}
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </button>
      ))}
    </div>
  );
}
