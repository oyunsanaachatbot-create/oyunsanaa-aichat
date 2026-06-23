import { auth } from "@/app/(auth)/auth";
import { getDictionary } from "@/lib/i18n/dictionaries";
import FinanceAppClient from "./FinanceAppClient";

export default async function FinanceAppPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const t = await getDictionary();
    return (
      <div style={{ padding: 16 }}>
        {t.apps.finance.notLoggedIn}
      </div>
    );
  }

  return <FinanceAppClient userId={userId} />;
}
