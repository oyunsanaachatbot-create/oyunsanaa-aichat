import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return userId;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const db = getPgAdmin();
    const { data: items, error } = await db
      .from("goal_items")
      .select(
        [
          "id",
          "local_id",
          "goal_text",
          "category",
          "session_id",
          "user_id",
          "created_at",
          "updated_at",
          "goal_type",
          "start_date",
          "end_date",
          "description",
          "effort_unit",
          "effort_hours",
          "effort_minutes",
          "frequency",
          "completed_days",
        ].join(",")
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: items ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const db = getPgAdmin();
    const body = await req.json().catch(() => ({}));

    const title: string = body?.title ?? "Зорилгууд";
    const goals: any[] = Array.isArray(body?.goals) ? body.goals : [];
    if (!goals.length) return NextResponse.json({ error: "EMPTY_GOALS" }, { status: 400 });

    const { data: lastSession } = await db
      .from("goal_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sessionId = lastSession?.id;

    if (!sessionId) {
      const { data: s, error: sErr } = await db
        .from("goal_sessions")
        .insert({ user_id: userId, title })
        .select("id")
        .single();

      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
      sessionId = s.id;
    }

    const rows = goals.map((g) => ({
      user_id: userId,
      session_id: sessionId,
      local_id: g.local_id ?? g.localId ?? crypto.randomUUID(),
      goal_text: g.goal_text ?? "",
      category: g.goal_type ?? g.category ?? null,
      goal_type: g.goal_type ?? null,
      start_date: g.start_date ?? null,
      end_date: g.end_date ?? null,
      description: g.description ?? null,
      effort_unit: g.effort_unit ?? null,
      effort_hours: g.effort_hours ?? null,
      effort_minutes: g.effort_minutes ?? null,
      frequency: g.frequency ?? null,
      completed_days: 0,
    }));

    const { error } = await db.from("goal_items").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const db = getPgAdmin();
    const body = await req.json().catch(() => ({}));
    const localId = body?.local_id ?? body?.localId;
    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    const { error } = await db
      .from("goal_items")
      .delete()
      .eq("user_id", userId)
      .eq("local_id", localId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const db = getPgAdmin();
    const body = await req.json().catch(() => ({}));
    const localId = body?.local_id ?? body?.localId;
    const op = body?.op;

    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    if (op === "inc_done") {
      const { data: cur, error: selErr } = await db
        .from("goal_items")
        .select("completed_days")
        .eq("user_id", userId)
        .eq("local_id", localId)
        .maybeSingle();

      if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

      const next = Math.max(0, Number(cur?.completed_days ?? 0) + 1);

      const { error: upErr } = await db
        .from("goal_items")
        .update({ completed_days: next })
        .eq("user_id", userId)
        .eq("local_id", localId);

      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "UNKNOWN_OP" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}
