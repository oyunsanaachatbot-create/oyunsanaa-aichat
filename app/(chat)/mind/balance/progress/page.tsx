"use client";

import { AppCard, AppShell, Badge, Button, PageHero } from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";

export default function BalanceProgressPage() {
  const t = useT();
  const b = t.apps.balance.progressPage;

  return (
    <AppShell title={t.apps.balance.test.title} subtitle={b.title} width="4xl">
      <AppCard>
        <PageHero
          icon="📈"
          eyebrow={<Badge>Ахиц</Badge>}
          title={b.title}
          description={b.text}
        />
        <div className="flex flex-wrap gap-3">
          <Button href="/mind/balance/test">{b.toTest}</Button>
          <Button variant="ghost" href="/mind/balance/result">
            {b.toResult}
          </Button>
        </div>
      </AppCard>
    </AppShell>
  );
}
