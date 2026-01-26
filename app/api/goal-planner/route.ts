import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function GET() {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { data: items, error } = await supabase
    .from("goal_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const title: string = body?.title ?? "Зорилгын багц";
  const goals: Array<{
    goal_text: string;
    category?: string | null;
    priority?: number | null;
    target_date?: string | null; // YYYY-MM-DD
  }> = body?.goals ?? [];

  if (!Array.isArray(goals) || goals.length === 0) {
    return NextResponse.json({ error: "NO_GOALS" }, { status: 400 });
  }

  const { data: session, error: sErr } = await supabase
    .from("goal_sessions")
    .insert([{ user_id: user.id, title }])
    .select("id")
    .single();

  if (sErr || !session) {
    return NextResponse.json({ error: sErr?.message ?? "SESSION_FAIL" }, { status: 500 });
  }

  const rows = goals
    .map((g) => ({
      session_id: session.id,
      user_id: user.id,
      goal_text: String(g.goal_text ?? "").trim(),
      category: g.category ?? null,
      priority: Number(g.priority ?? 3),
      target_date: g.target_date ?? null,
      status: "draft",
    }))
    .filter((r) => r.goal_text.length > 0);

  const { data: inserted, error: iErr } = await supabase.from("goal_items").insert(rows).select("*");

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
  return NextResponse.json({ session_id: session.id, items: inserted ?? [] });
}

export async function PATCH(req: Request) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await req.json();
  const id: string = body?.id;
  const updates: any = body?.updates ?? {};

  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const allowed: any = {};
  if (typeof updates.goal_text === "string") allowed.goal_text = updates.goal_text;
  if (typeof updates.category === "string" || updates.category === null) allowed.category = updates.category;
  if (typeof updates.priority === "number") allowed.priority = updates.priority;
  if (typeof updates.target_date === "string" || updates.target_date === null) allowed.target_date = updates.target_date;
  if (typeof updates.status === "string") allowed.status = updates.status;

  const { data, error } = await supabase
    .from("goal_items")
    .update(allowed)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: Request) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const { error } = await supabase.from("goal_items").delete().eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
