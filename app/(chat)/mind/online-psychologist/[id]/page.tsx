import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  assertDirectConversationAccess,
  type DirectChatActor,
} from "@/lib/db/psychologist-chat";
import { getSharedUserById } from "@/lib/db/therapy";
import { OnlinePsychologistThread } from "../online-psychologist-thread";

export const dynamic = "force-dynamic";

export default async function OnlinePsychologistChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session?.user?.id ||
    !session.user.email ||
    session.user.type === "guest"
  ) {
    redirect("/login");
  }

  const me = await getSharedUserById(session.user.id);
  if (!me) redirect("/login");

  const { id } = await params;
  const actor: DirectChatActor = me;
  const access = await assertDirectConversationAccess(id, actor);
  if (!access) redirect("/mind/online-psychologist");

  const counterpartName =
    access.role === "patient"
      ? null
      : access.conversation.patientName;
  return (
    <OnlinePsychologistThread
      conversationId={id}
      counterpartName={counterpartName}
      myId={me.id}
      role={access.role}
    />
  );
}
