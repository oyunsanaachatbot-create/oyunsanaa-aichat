import { NextResponse } from "next/server";
import { getPsychologistChatActor } from "../../actor";

/** Direct inboxes stay writable; unlike booked therapy chats they cannot close. */
export async function PATCH() {
  const actor = await getPsychologistChatActor();
  if (!actor) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Direct psychologist chats are always open" },
    { status: 409 }
  );
}
