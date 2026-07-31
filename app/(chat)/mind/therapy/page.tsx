import { auth } from "@/app/(auth)/auth";
import {
  getChatableAppointments,
  getSharedUserById,
  listConversationsForUser,
} from "@/lib/db/therapy";
import { TherapyHome } from "./therapy-home";

export const dynamic = "force-dynamic";

export default async function TherapyPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  const me = userId ? await getSharedUserById(userId) : null;
  const [conversations, appointments] = await Promise.all([
    userId && email
      ? listConversationsForUser({ id: userId, email })
      : Promise.resolve([]),
    me ? getChatableAppointments(me) : Promise.resolve([]),
  ]);

  return (
    <TherapyHome
      appointments={appointments}
      conversations={conversations}
      role={me?.role ?? null}
    />
  );
}
