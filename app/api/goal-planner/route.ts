import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey);
}

// Түр тестийн user_id (табль дээр user_id NOT NULL тул хэрэгтэй)
// Дараа нь NextAuth user-тай чинь холбож жинхэнэ user_id болгоно.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: items, error } = await supabase
      .from("goal_items")
      .select("*")
      .eq("user_id", DEV_USER_ID)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: items ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json();

    const title: string = body?.title ?? "Зорилгын багц";
    const goals: Array<{
      goal_text: string;
      category?: string | null;
      priority?: number | null;
      target_date?: string | null;
    }> = body?.goals ?? [];

    if (!Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: "NO_GOALS" }, { status: 400 });
    }

    const { data: session, error: sErr } = await supabase
      .from("goal_sessions")
      .insert([{ user_id: DEV_USER_ID, title }])
      .select("id")
      .single();

    if (sErr || !session) {
      return NextResponse.json({ error: sErr?.message ?? "SESSION_FAIL" }, { status: 500 });
    }

    const rows = goals
      .map((g) => ({
        session_id: session.id,
        user_id: DEV_USER_ID,
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = supabaseAdmin();
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
      .eq("user_id", DEV_USER_ID)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = supabaseAdmin();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

    const { error } = await supabase.from("goal_items").delete().eq("id", id).eq("user_id", DEV_USER_ID);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}
