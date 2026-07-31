"use client";

import { AppShell } from "@/components/mind/app-shell";
import { BalanceExercise } from "@/components/mind/who-am-i/balance-exercise";
import { useT } from "@/lib/i18n/provider";

export default function WhoAmIBalanceTestPage() {
  const t = useT();

  return (
    <AppShell
      backHref="/mind/programs/active"
      title={t.apps.lifeBalance.pageTitles.balanceTest}
      width="4xl"
    >
      <BalanceExercise />
    </AppShell>
  );
}
