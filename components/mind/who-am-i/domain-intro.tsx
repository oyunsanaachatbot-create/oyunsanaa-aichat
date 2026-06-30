"use client";

import { useEffect, useState } from "react";
import {
  AppCard,
  AppShell,
  Button,
  Muted,
  PageHero,
} from "@/components/mind/app-shell";
import type { BalanceAreaKey } from "@/lib/mind/who-am-i-balance";
import { readLastRun } from "@/lib/mind/who-am-i-balance";

export function DomainIntroPage({
  icon,
  title,
  balanceKey,
  hex,
  description,
  appHref,
  appLabel,
}: {
  icon: string;
  title: string;
  balanceKey: BalanceAreaKey;
  hex: string;
  description: string;
  appHref: string;
  appLabel: string;
}) {
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    const run = readLastRun();
    setPct(run ? run.pct[balanceKey] : null);
  }, [balanceKey]);

  return (
    <AppShell backHref="/" title="Тайлбар" width="3xl">
      <AppCard>
        <PageHero
          eyebrow={
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-[11px] uppercase tracking-wide"
              style={{
                background: `${hex}1A`,
                color: hex,
                border: `1px solid ${hex}30`,
              }}
            >
              {pct === null ? title : `${title}: ${pct}%`}
            </span>
          }
          icon={icon}
          title={title}
        />
        <Muted className="mb-6 whitespace-pre-line">{description}</Muted>
        <Button href={appHref}>{appLabel} →</Button>
      </AppCard>
    </AppShell>
  );
}
