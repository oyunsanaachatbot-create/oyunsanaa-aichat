import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

// ✅ Server-side admin client (service role)
function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function isoDate(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function getUserIdFromSession() {
  const session = await auth();
  const userId =
    (session as any)?.user?.id ||
    (session as any)?.user?.sub ||
    null;
  return userId as string | null;
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

    const supabase = adminSupabase();
    const { data, error } = await supabase
      .from("goal_logs")
      .select("*")
      .eq("user_id", user_id)
      .eq("log_date", date)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
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

    const body = await req.json().catch(() => ({}));
    const goal_id = String(body.goal_id || "").trim();
    const date = String(body.date || isoDate()).trim();
    const minutes =
      typeof body.minutes === "number" ? body.minutes : Number(body.minutes ?? 0);

    if (!goal_id) {
      return NextResponse.json({ error: "MISSING_GOAL_ID" }, { status: 400 });
    }

    const supabase = adminSupabase();
    const { data, error } = await supabase
      .from("goal_logs")
      .insert({
        user_id,
        goal_id,
        log_date: date,
        minutes: Number.isFinite(minutes) ? minutes : 0,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}
