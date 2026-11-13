import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getSharedUserById,
  listConversationsForUser,
  type TherapyActor,
} from "@/lib/db/therapy";

async function sessionActor(): Promise<TherapyActor | null> {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email) return null;
  const user = await getSharedUserById(id);
  return user?.role === "LOCATION_PROVIDER" ? null : { id, email };
}

// GET /api/therapy/conversations — conversations the current user takes part in.
export async function GET() {
  try {
    const actor = await sessionActor();
    if (!actor) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const conversations = await listConversationsForUser(actor);
    return NextResponse.json({ conversations });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/therapy/conversations { appointmentId } — open (or reuse) the chat
// thread for a confirmed online appointment. Either participant may open it.
export async function POST(_req: Request) {
  try {
    const actor = await sessionActor();
    if (!actor) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          "Appointment chat is no longer available. Existing chats are read-only archives.",
      },
      { status: 410 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
