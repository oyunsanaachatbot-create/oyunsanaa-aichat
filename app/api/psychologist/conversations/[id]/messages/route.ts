import { NextResponse } from "next/server";
import { psychologistConversationChannel } from "@/lib/db/therapy-channel";
import {
  assertDirectConversationAccess,
  getDirectMessages,
  insertDirectMessage,
} from "@/lib/db/psychologist-chat";
import { getSql } from "@/lib/db/pgClient";
import { getPsychologistChatActor } from "../../../actor";

const MAX_BODY = 4000;
type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  const actor = await getPsychologistChatActor();
  if (!actor) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertDirectConversationAccess(id, actor);
  if (!access) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const messages = await getDirectMessages(id, access.role);
  return NextResponse.json({ messages, role: access.role });
}

export async function POST(req: Request, { params }: RouteCtx) {
  const actor = await getPsychologistChatActor();
  if (!actor) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertDirectConversationAccess(id, actor);
  if (!access) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (access.conversation.status !== "open") {
    return NextResponse.json(
      { error: "Conversation is closed" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body?.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const message = await insertDirectMessage({
    conversationId: id,
    actor,
    role: access.role,
    body: text,
  });
  if (!message) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  // Persistence is the source of truth. Realtime delivery is best-effort;
  // the client also polls to recover from a dropped NOTIFY.
  const sql = getSql();
  if (sql) {
    try {
      await sql.notify(
        psychologistConversationChannel(id),
        JSON.stringify(message)
      );
    } catch {
      // The saved message will be returned by the next history fetch.
    }
  }

  return NextResponse.json({ message });
}
