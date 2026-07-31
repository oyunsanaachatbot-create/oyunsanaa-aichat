"use client";

import { AppShell } from "@/components/mind/app-shell";
import { BalanceExercise } from "@/components/mind/who-am-i/balance-exercise";

export default function ProgramsArchivePage() {
  return (
    <AppShell
      backHref="/mind/programs/active"
      title="Сургалтын архив"
      width="4xl"
    >
      <BalanceExercise initialScreen="history" />
    </AppShell>
  );
}
