"use client";
import { Sparkles } from "lucide-react";
import { chatCopy } from "@/lib/i18n/chat-copy";
import { useLocale } from "@/lib/i18n/provider";

export function Greeting() {
  const copy = chatCopy[useLocale()];
  return (
    <div className="space-y-4" data-testid="chat-greeting">
      <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-primary md:size-14">
        <Sparkles aria-hidden="true" className="size-6" />
      </div>
      <h1 className="max-w-xl text-balance font-semibold text-2xl leading-tight tracking-tight md:text-4xl">
        {copy.title}
      </h1>
      <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
        {copy.subtitle}
      </p>
    </div>
  );
}
