import { NextResponse } from "next/server";
import {
  createOrGetDirectConversation,
  listDirectConversations,
} from "@/lib/db/psychologist-chat";
import { getPsychologistChatActor } from "../actor";

export async function GET() {
  const actor = await getPsychologistChatActor();
  if (!actor) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const conversations = await listDirectConversations(actor);
  return NextResponse.json({ conversations, role: actor.role });
}

export async function POST() {
  const actor = await getPsychologistChatActor();
  if (!actor) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (actor.role === "PSYCHOLOGIST") {
    return NextResponse.json(
      { error: "Psychologists cannot start a patient chat" },
      { status: 403 }
    );
  }

  const conversation = await createOrGetDirectConversation(actor.id);
  if (!conversation) {
    return NextResponse.json(
      { error: "No online psychologist is available" },
      { status: 409 }
    );
  }

  return NextResponse.json({ conversationId: conversation.id });
}
