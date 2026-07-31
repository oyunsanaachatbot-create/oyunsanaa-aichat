import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getSharedUserById } from "@/lib/db/therapy";
import { listDirectConversations } from "@/lib/db/psychologist-chat";
import { OnlinePsychologistHome } from "./online-psychologist-home";

export const dynamic = "force-dynamic";

export default async function OnlinePsychologistPage() {
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

  const conversations = await listDirectConversations(me);
  return (
    <OnlinePsychologistHome conversations={conversations} role={me.role} />
  );
}
