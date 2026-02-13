import { auth } from "@/app/(auth)/auth";
import FinanceAppClient from "./FinanceAppClient";

export default async function FinanceAppPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div style={{ padding: 16 }}>
        Нэвтэрсний дараа Санхүү апп нээгдэнэ.
      </div>
    );
  }

  return <FinanceAppClient userId={userId} />;
}
