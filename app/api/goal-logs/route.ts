import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * NOTE:
 * - Энэ проект дээр auth cookie ашиглаж user танина.
 * - @supabase/ssr байхгүй бол pnpm add @supabase/ssr гэж суулгана.
 */

function supabaseServer() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * GET /api/goal-logs?date=YYYY-MM-DD
 * тухайн өдрийн бүх log-ийг авчирна
 */
export async function GET(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? isoDate(new Date());

  const { data, error } = await supabase
    .from("goal_logs")
    .select("goal_id, log_date, done, note")
    .eq("user_id", user.id)
    .eq("log_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ date, logs: data ?? [] });
}

/**
 * POST /api/goal-logs
 * body: { goal_id, date, done, note }
 * upsert (unique: user_id + goal_id + log_date)
 */
export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const goal_id = String(body?.goal_id ?? "");
  const date = String(body?.date ?? isoDate(new Date()));
  const done = Boolean(body?.done ?? false);
  const note = typeof body?.note === "string" ? body.note : null;

  if (!goal_id) return NextResponse.json({ error: "MISSING_GOAL_ID" }, { status: 400 });

  const payload = {
    user_id: user.id,
    goal_id,
    log_date: date,
    done,
    note,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("goal_logs")
    .upsert(payload, { onConflict: "user_id,goal_id,log_date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
