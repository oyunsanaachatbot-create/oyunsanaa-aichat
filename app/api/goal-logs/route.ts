import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";
import { calendarDateSchema, goalLogSchema } from "@/lib/life/input-validation";

function isoDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function getUserIdFromSession() {
  const session = await auth();
  return session?.user?.id ?? null;
}

// GET /api/goal-logs?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const user_id = await getUserIdFromSession();
    if (!user_id) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get("date") || isoDate();
    if (!calendarDateSchema.safeParse(date).success) {
      return NextResponse.json({ error: "INVALID_DATE" }, { status: 400 });
    }

    const db = getPgAdmin();
    const { data, error } = await db
      .from("goal_logs")
      .select("*")
      .eq("user_id", user_id)
      .eq("log_date", date)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

// POST /api/goal-logs
// body: { goal_id: string, date?: "YYYY-MM-DD", minutes?: number }
export async function POST(req: Request) {
  try {
    const user_id = await getUserIdFromSession();
    if (!user_id) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const parsed = goalLogSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_GOAL_LOG" }, { status: 400 });
    }
    const { goal_id, date = isoDate(), minutes } = parsed.data;

    const db = getPgAdmin();
    const { data: goal, error: goalError } = await db.from("goal_items")
      .select("id").eq("id", goal_id).eq("user_id", user_id).maybeSingle();
    if (goalError) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    if (!goal) return NextResponse.json({ error: "GOAL_NOT_FOUND" }, { status: 404 });
    const { data, error } = await db
      .from("goal_logs")
      .insert({
        user_id,
        goal_id,
        log_date: date,
        minutes,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
