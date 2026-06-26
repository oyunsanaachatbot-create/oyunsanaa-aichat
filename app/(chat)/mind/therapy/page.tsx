import { auth } from "@/app/(auth)/auth";
import {
  getChatableAppointments,
  getSchedulingUserByEmail,
  listConversationsForEmail,
} from "@/lib/db/therapy";
import { TherapyHome } from "./therapy-home";

export const dynamic = "force-dynamic";

export default async function TherapyPage() {
  const session = await auth();
  const email = session?.user?.email ?? null;

  const me = email ? await getSchedulingUserByEmail(email) : null;
  const [conversations, appointments] = await Promise.all([
    email ? listConversationsForEmail(email) : Promise.resolve([]),
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
