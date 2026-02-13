import { auth } from "@/app/(auth)/auth";
import { FinanceCapturePanel } from "@/components/chat/FinanceCapturePanel";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-6">
        Нэвтрээгүй байна. Login хийгээд дахин орно уу.
      </div>
    );
  }

  return (
    <div className="p-4">
      <FinanceCapturePanel active={true} userId={userId} />
      {/* эндээс доош чинь finance-app page-ийн чинь бусад UI байна */}
    </div>
  );
}
