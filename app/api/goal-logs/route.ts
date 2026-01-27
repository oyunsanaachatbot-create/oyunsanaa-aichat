import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

export async function GET(req: Request) {
  const cookieStore = await cookies(); // ✅ ЭНЭ Л ГОЛ ЗАСВАР
  const supabase = getSupabase(cookieStore);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? isoDate(new Date());

  const { data, error } = await supabase
    .from("goal_logs")
    .select("goal_id, log_date, done, note")
    .eq("user_id", auth.user.id)
    .eq("log_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ date, logs: data ?? [] });
}

export async function POST(req: Request) {
  const cookieStore = await cookies(); // ✅ ЭНЭ Л ГОЛ ЗАСВАР
  const supabase = getSupabase(cookieStore);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const goal_id = String(body?.goal_id ?? "");
  const date = String(body?.date ?? isoDate(new Date()));
  const done = Boolean(body?.done ?? false);
  const note = typeof body?.note === "string" ? body.note : null;

  if (!goal_id) return NextResponse.json({ error: "MISSING_GOAL_ID" }, { status: 400 });

  const { error } = await supabase
    .from("goal_logs")
    .upsert(
      { user_id: auth.user.id, goal_id, log_date: date, done, note },
      { onConflict: "user_id,goal_id,log_date" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
