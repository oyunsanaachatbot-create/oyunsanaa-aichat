import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  assertConversationAccess,
  getAppointmentSummaryById,
  getSharedUserById,
} from "@/lib/db/therapy";
import { ChatThread } from "./chat-thread";

export const dynamic = "force-dynamic";

export default async function TherapyChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  if (!userId || !email) {
    redirect("/login");
  }
  const sharedUser = await getSharedUserById(userId);
  if (sharedUser?.role === "LOCATION_PROVIDER") {
    redirect("/mind/therapy");
  }

  const access = await assertConversationAccess(id, { id: userId, email });
  if (!access) {
    redirect("/mind/therapy");
  }

  const counterpartEmail =
    access.role === "client"
      ? access.conversation.psychologistEmail
      : access.conversation.clientEmail;

  const appt = access.conversation.appointmentId
    ? await getAppointmentSummaryById(access.conversation.appointmentId)
    : null;

  return (
    <ChatThread
      appointment={appt}
      appointmentLinked={Boolean(access.conversation.appointmentId)}
      conversationId={id}
      conversationStatus={access.conversation.status}
      counterpartEmail={counterpartEmail}
      myEmail={email}
      role={access.role}
    />
  );
}
