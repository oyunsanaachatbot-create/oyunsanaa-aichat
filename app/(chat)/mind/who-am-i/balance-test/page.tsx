"use client";

import { AppShell } from "@/components/mind/app-shell";
import { BalanceExercise } from "@/components/mind/who-am-i/balance-exercise";

export default function WhoAmIBalanceTestPage() {
  return (
    <AppShell
      backHref="/mind/who-am-i/intro"
      title="Амьдралын тэнцвэр шалгах"
      width="4xl"
    >
      <BalanceExercise />
    </AppShell>
  );
}
