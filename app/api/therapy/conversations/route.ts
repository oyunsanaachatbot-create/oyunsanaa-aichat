import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";
import {
  getAppointmentParties,
  listConversationsForUser,
  type TherapyActor,
} from "@/lib/db/therapy";

async function sessionActor(): Promise<TherapyActor | null> {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  return id && email ? { id, email } : null;
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
export async function POST(req: Request) {
  try {
    const actor = await sessionActor();
    if (!actor) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const appointmentId: string | undefined = body?.appointmentId;
    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId required" },
        { status: 400 }
      );
    }

    const parties = await getAppointmentParties(appointmentId);
    if (!parties) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Ownership: caller must be the patient or the psychologist on this booking.
    if (actor.id !== parties.patientId && actor.id !== parties.psychologistId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Chat is only for confirmed online sessions.
    if (parties.sessionType !== "ONLINE") {
      return NextResponse.json(
        { error: "Chat is available for online sessions only" },
        { status: 409 }
      );
    }
    if (parties.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Appointment is not confirmed yet" },
        { status: 409 }
      );
    }
    if (parties.windowEnded) {
      return NextResponse.json(
        { error: "Appointment time has ended" },
        { status: 409 }
      );
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
    }

    // Insert-or-get by the unique appointment_id.
    const rows = await sql<{ id: string }[]>`
      INSERT INTO therapy_conversation (appointment_id, client_email, psychologist_email)
      VALUES (${appointmentId}, ${parties.patientEmail}, ${parties.psychologistEmail})
      ON CONFLICT (appointment_id)
        DO UPDATE SET
          client_email = EXCLUDED.client_email,
          psychologist_email = EXCLUDED.psychologist_email
      RETURNING id
    `;

    return NextResponse.json({ conversationId: rows[0]?.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
