import HealthAppClient from "@/components/health/HealthAppClient";
import { AppShell } from "@/components/mind/app-shell";

export default function HealthPage() {
  return (
    <AppShell
      title="Эрүүл мэнд"
      subtitle="Стресс, нойр, эрч хүчээ хянаж, өдөр тутмын байдлаа бүртгээрэй."
      width="4xl"
    >
      <HealthAppClient />
    </AppShell>
  );
}

