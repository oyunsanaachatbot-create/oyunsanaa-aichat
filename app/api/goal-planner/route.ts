import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey);
}

// Түр тест user_id (чиний одоо хэрэглэж байгаа 000...)
// Дараа нь NextAuth user_id-тай холбох боломжтой.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: items, error } = await supabase
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
          // ✅ шинэ баганууд
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
      .eq("user_id", DEV_USER_ID)
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
    const supabase = supabaseAdmin();
    const body = await req.json().catch(() => ({}));

    const title: string = body?.title ?? "Зорилгууд";
    const goals: any[] = Array.isArray(body?.goals) ? body.goals : [];
    if (!goals.length) return NextResponse.json({ error: "EMPTY_GOALS" }, { status: 400 });

    // ✅ Session: хамгийн сүүлийн session байвал ашиглана, байхгүй бол шинээр үүсгэнэ
    const { data: lastSession } = await supabase
      .from("goal_sessions")
      .select("id")
      .eq("user_id", DEV_USER_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sessionId = lastSession?.id;

    if (!sessionId) {
      const { data: s, error: sErr } = await supabase
        .from("goal_sessions")
        .insert({ user_id: DEV_USER_ID, title })
        .select("id")
        .single();

      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
      sessionId = s.id;
    }

    // ✅ Insert goal_items — шинэ баганууд бүгд хадгалагдана
    const rows = goals.map((g) => ({
      user_id: DEV_USER_ID,
      session_id: sessionId,

      local_id: g.local_id ?? g.localId ?? crypto.randomUUID(),

      goal_text: g.goal_text ?? "",
      // хуучин category руу goal_type-оо давхар хийж өгнө (хуучин UI эвдэхгүй)
      category: g.goal_type ?? g.category ?? null,

      // шинэ баганууд
      goal_type: g.goal_type ?? null,
      start_date: g.start_date ?? null,
      end_date: g.end_date ?? null,
      description: g.description ?? null,
      effort_unit: g.effort_unit ?? null,
      effort_hours: g.effort_hours ?? null,
      effort_minutes: g.effort_minutes ?? null,

      // frequency: 1..7 эсвэл null
      frequency: g.frequency ?? null,

      // хэрэгжүүлэлт
      completed_days: 0,
    }));

    const { error } = await supabase.from("goal_items").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const localId = body?.local_id ?? body?.localId;
    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    const { error } = await supabase
      .from("goal_items")
      .delete()
      .eq("user_id", DEV_USER_ID)
      .eq("local_id", localId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = supabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const localId = body?.local_id ?? body?.localId;
    const op = body?.op;

    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    if (op === "inc_done") {
      // completed_days = completed_days + 1
      // Supabase update-д шууд +1 хийхийн тулд эхлээд одоогийн утгыг аваад update хийнэ
      const { data: cur, error: selErr } = await supabase
        .from("goal_items")
        .select("completed_days")
        .eq("user_id", DEV_USER_ID)
        .eq("local_id", localId)
        .maybeSingle();

      if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

      const next = Math.max(0, Number(cur?.completed_days ?? 0) + 1);

      const { error: upErr } = await supabase
        .from("goal_items")
        .update({ completed_days: next })
        .eq("user_id", DEV_USER_ID)
        .eq("local_id", localId);

      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "UNKNOWN_OP" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SERVER_ERROR" }, { status: 500 });
  }
}
