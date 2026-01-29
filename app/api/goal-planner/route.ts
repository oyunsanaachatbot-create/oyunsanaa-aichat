import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  // ✅ NEXT_PUBLIC байхгүй бол SUPABASE_URL-аа ашигла
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey);
}

// Танайд одоогоор DEV user_id 0000... гэж ашиглаж байгаа тул хэвээр нь үлдээе
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

function normalizeItem(x: any) {
  return {
    id: x.id,
    localId: x.local_id ?? x.localId ?? x.id,
    goal_type: x.goal_type ?? x.category ?? "Хувийн",
    start_date: x.start_date ?? null,
    end_date: x.end_date ?? null,
    goal_text: x.goal_text ?? "",
    description: x.description ?? "",
    effort_unit: x.effort_unit ?? "Өдөрт",
    effort_hours: Number(x.effort_hours ?? 0),
    effort_minutes: Number(x.effort_minutes ?? 0),
    // frequency чинь одоогоор int (1..7) байгаа
    frequency: x.frequency ?? null,
    created_at: x.created_at ?? null,
  };
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: items, error } = await supabase
      .from("goal_items")
      .select(
        "id, local_id, goal_type, start_date, end_date, goal_text, description, effort_unit, effort_hours, effort_minutes, frequency, category, created_at"
      )
      .eq("user_id", DEV_USER_ID)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: (items ?? []).map(normalizeItem) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json().catch(() => ({}));

    const title: string = body?.title ?? "Зорилгууд";
    const goals: any[] = Array.isArray(body?.goals) ? body.goals : [];

    if (!goals.length) {
      return NextResponse.json({ error: "GOALS_EMPTY" }, { status: 400 });
    }

    // ✅ session үүсгэнэ (танайд goal_sessions table байгаа)
    const { data: sess, error: sessErr } = await supabase
      .from("goal_sessions")
      .insert({ user_id: DEV_USER_ID, title })
      .select("id")
      .single();

    if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });

    const sessionId = sess.id;

    const rows = goals.map((g) => ({
      user_id: DEV_USER_ID,
      session_id: sessionId,

      // хамгийн чухал нь local_id — UI жагсаалт тогтвортой болно
      local_id: g.localId ?? crypto.randomUUID(),

      goal_text: g.goal_text ?? "",
      // goal_type байхгүй бол хуучны category-г ашиглана
      goal_type: g.goal_type ?? g.category ?? "Хувийн",
      category: g.category ?? null, // хуучин багана байвал хадгалж болно

      start_date: g.start_date ?? null,
      end_date: g.end_date ?? null,
      description: g.description ?? "",

      effort_unit: g.effort_unit ?? "Өдөрт",
      effort_hours: Number(g.effort_hours ?? 0),
      effort_minutes: Number(g.effort_minutes ?? 0),

      // frequency: int (1..7) эсвэл null
      frequency: Array.isArray(g.frequency) ? (g.frequency[0] ?? null) : (g.frequency ?? null),
    }));

    const { error } = await supabase.from("goal_items").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "POST_FAILED" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const localId = String(body?.localId || "");
    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    const { error } = await supabase
      .from("goal_items")
      .delete()
      .eq("user_id", DEV_USER_ID)
      .eq("local_id", localId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DELETE_FAILED" }, { status: 500 });
  }
}
