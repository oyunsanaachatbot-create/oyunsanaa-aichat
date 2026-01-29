import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error("Missing env: SUPABASE url/service key");
  return createClient(url, serviceKey);
}

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

function pickDate(searchParams: URLSearchParams) {
  const d = searchParams.get("date");
  if (!d) return null;
  // yyyy-mm-dd хэлбэр гэж үзнэ
  return d;
}

// GET /api/goal-progress?date=2026-01-29
export async function GET(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const date = pickDate(searchParams);
    if (!date) return NextResponse.json({ error: "MISSING_DATE" }, { status: 400 });

    const { data, error } = await supabase
      .from("goal_daily_progress")
      .select("local_id, done")
      .eq("user_id", DEV_USER_ID)
      .eq("day", date);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // map: { [local_id]: true/false }
    const map: Record<string, boolean> = {};
    for (const r of data ?? []) map[r.local_id] = !!r.done;

    return NextResponse.json({ map });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

// POST { date, localId, done }
export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const date: string = body?.date;
    const localId: string = body?.localId;
    const done: boolean = !!body?.done;

    if (!date) return NextResponse.json({ error: "MISSING_DATE" }, { status: 400 });
    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    // upsert (unique: user_id + local_id + day)
    const { error } = await supabase
      .from("goal_daily_progress")
      .upsert(
        { user_id: DEV_USER_ID, local_id: localId, day: date, done },
        { onConflict: "user_id,local_id,day" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}
