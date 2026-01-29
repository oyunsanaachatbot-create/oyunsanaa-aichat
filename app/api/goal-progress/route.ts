import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error("Missing env: SUPABASE url/service key");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function pickDate(searchParams: URLSearchParams) {
  const d = searchParams.get("date");
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

async function getUserIdFromSession() {
  const session = await auth();
  const userId = (session as any)?.user?.id ?? null;
  return userId as string | null;
}

// GET /api/goal-progress?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const user_id = await getUserIdFromSession();
    if (!user_id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = pickDate(searchParams);
    if (!date) return NextResponse.json({ error: "MISSING_DATE" }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("goal_daily_progress")
      .select("local_id, done")
      .eq("user_id", user_id)
      .eq("day", date);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    const user_id = await getUserIdFromSession();
    if (!user_id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const date = String(body?.date ?? "");
    const local_id = String(body?.localId ?? body?.local_id ?? "");
    const done = Boolean(body?.done);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return NextResponse.json({ error: "INVALID_DATE" }, { status: 400 });
    if (!local_id) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    const supabase = supabaseAdmin();

    // upsert: тухайн өдөр/зорилго дээр нэг мөр л байлгах
    const { error } = await supabase
      .from("goal_daily_progress")
      .upsert(
        { user_id, day: date, local_id, done, updated_at: new Date().toISOString() },
        { onConflict: "user_id,day,local_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}
