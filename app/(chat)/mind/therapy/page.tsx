import { auth } from "@/app/(auth)/auth";
import { getSharedUserById, listConversationsForUser } from "@/lib/db/therapy";
import { TherapyHome } from "./therapy-home";

export const dynamic = "force-dynamic";

export default async function TherapyPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  const me = userId ? await getSharedUserById(userId) : null;
  const conversations =
    me?.role === "LOCATION_PROVIDER"
      ? []
      : userId && email
        ? await listConversationsForUser({ id: userId, email })
        : [];

  return <TherapyHome conversations={conversations} role={me?.role ?? null} />;
}
