import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";
import { conversationChannel } from "@/lib/db/therapy-channel";
import {
  assertConversationAccess,
  getAppointmentSummaryById,
} from "@/lib/db/therapy";

const MAX_BODY = 4000;

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

type RouteCtx = { params: Promise<{ id: string }> };

// GET — messages in the thread (oldest first). Also marks the caller's
// incoming messages as read.
export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const email = await sessionEmail();
    if (!email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    const access = await assertConversationAccess(id, email);
    if (!access) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
    }

    // Mark messages from the other party as read.
    await sql`
      UPDATE therapy_message
      SET read_at = now()
      WHERE conversation_id = ${id}
        AND lower(sender_email) <> lower(${email})
        AND read_at IS NULL
    `;

    const messages = await sql`
      SELECT
        id,
        conversation_id AS "conversationId",
        sender_email AS "senderEmail",
        sender_role AS "senderRole",
        body,
        read_at AS "readAt",
        created_at AS "createdAt"
      FROM therapy_message
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages, role: access.role });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST { body } — send a message. Persists, bumps last_message_at, and
// NOTIFYs the conversation channel for real-time delivery.
export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const email = await sessionEmail();
    if (!email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    const access = await assertConversationAccess(id, email);
    if (!access) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (access.conversation.status !== "open") {
      return NextResponse.json({ error: "Conversation is closed" }, { status: 409 });
    }
    // Tie messaging to the booking. A cancelled appointment freezes the chat,
    // and once the booked session's end time has passed the chat becomes
    // read-only for everyone — this is the server-side guarantee that a client
    // cannot keep chatting after the appointment hour ends (the client UI also
    // locks itself, but the rule is enforced here so it can't be bypassed).
    if (access.conversation.appointmentId) {
      const appt = await getAppointmentSummaryById(
        access.conversation.appointmentId
      );
      if (appt && appt.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Appointment was cancelled" },
          { status: 409 }
        );
      }
      if (appt && appt.windowEnded) {
        return NextResponse.json(
          { error: "Appointment time has ended" },
          { status: 409 }
        );
      }
    }

    const json = await req.json().catch(() => ({}));
    const text = String(json?.body ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
    }

    const rows = await sql<any[]>`
      INSERT INTO therapy_message (conversation_id, sender_email, sender_role, body)
      VALUES (${id}, ${email}, ${access.role}, ${text})
      RETURNING
        id,
        conversation_id AS "conversationId",
        sender_email AS "senderEmail",
        sender_role AS "senderRole",
        body,
        read_at AS "readAt",
        created_at AS "createdAt"
    `;
    const message = rows[0];

    await sql`
      UPDATE therapy_conversation SET last_message_at = now() WHERE id = ${id}
    `;

    // Real-time fan-out is best-effort: the message is already persisted, so a
    // NOTIFY failure must not fail the request. This matters because a 4000-char
    // Cyrillic body is up to ~8000 bytes in UTF-8 and, with the JSON envelope,
    // can exceed Postgres's 8000-byte NOTIFY payload limit. If the broadcast is
    // dropped the recipient still gets the message on their next history fetch.
    try {
      await sql.notify(conversationChannel(id), JSON.stringify(message));
    } catch {
      // swallow — delivery falls back to polling/history reload
    }

    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
