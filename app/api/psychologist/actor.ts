import { auth } from "@/app/(auth)/auth";
import { getSharedUserById, type SharedUser } from "@/lib/db/therapy";

export async function getPsychologistChatActor(): Promise<SharedUser | null> {
  const session = await auth();
  if (
    !session?.user?.id ||
    !session.user.email ||
    session.user.type === "guest"
  ) {
    return null;
  }

  return getSharedUserById(session.user.id);
}
