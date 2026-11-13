import HealthAppClient from "@/components/health/HealthAppClient";
import { AppShell } from "@/components/mind/app-shell";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function HealthPage() {
  const t = await getDictionary();
  return (
    <AppShell
      title={t.apps.stress.title}
      subtitle={t.apps.stress.subtitle}
      width="4xl"
    >
      <HealthAppClient />
    </AppShell>
  );
}

