import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";
import {
  assertConversationAccess,
  getAppointmentSummaryById,
} from "@/lib/db/therapy";

type RouteCtx = { params: Promise<{ id: string }> };

// PATCH { status: "open" | "closed" } — only the psychologist may open/close
// (stop) the conversation.
export async function PATCH(req: Request, { params }: RouteCtx) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email;
    if (!userId || !email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { id } = await params;

    const access = await assertConversationAccess(id, { id: userId, email });
    if (!access) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (access.role !== "psychologist") {
      return NextResponse.json(
        { error: "Only the psychologist can change the chat status" },
        { status: 403 }
      );
    }
    if (access.conversation.appointmentId) {
      const appt = await getAppointmentSummaryById(
        access.conversation.appointmentId
      );
      if (
        !appt ||
        appt.sessionType !== "ONLINE" ||
        appt.status !== "CONFIRMED" ||
        appt.windowEnded
      ) {
        return NextResponse.json(
          { error: "Appointment chat can no longer be changed" },
          { status: 409 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const status = body?.status;
    if (status !== "open" && status !== "closed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
    }

    await sql`
      UPDATE therapy_conversation SET status = ${status} WHERE id = ${id}
    `;

    return NextResponse.json({ status });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
