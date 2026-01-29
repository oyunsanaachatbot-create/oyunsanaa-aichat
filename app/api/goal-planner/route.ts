import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// энэ API нь goal_sessions + goal_items дээр ажиллана
// UI-ээс ирэх payload:
// { title: string, goals: [{ localId, goal_text, goal_type, start_date, end_date, description, effort_unit, effort_hours, effort_minutes, frequency }] }

function pickUserId(anyUserId: string | null) {
  // танайд guest identity 0000... байж болох тул fallback тавилаа
  return anyUserId && anyUserId.length > 0 ? anyUserId : "00000000-0000-0000-0000-000000000000";
}

export async function GET() {
  try {
    const supabase = await createClient();

    // ✅ хэрэглэгчийн id авч чадвал авна (танай auth-оос хамаарна)
    const { data: auth } = await supabase.auth.getUser();
    const userId = pickUserId(auth?.user?.id ?? null);

    // хамгийн сүүлийн session (draft) – байхгүй бол зүгээр items-ийг шууд уншина
    const { data: sess } = await supabase
      .from("goal_sessions")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let q = supabase
      .from("goal_items")
      .select(
        "id, local_id, goal_type, start_date, end_date, goal_text, description, effort_unit, effort_hours, effort_minutes, frequency, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (sess?.id) q = q.eq("session_id", sess.id);

    const { data: items, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // UI чинь localId гэж уншдаг тул local_id-г localId болгож normalize
    const normalized =
      (items ?? []).map((x: any) => ({
        id: x.id,
        localId: x.local_id ?? x.localId ?? x.id,
        goal_type: x.goal_type ?? "Хувийн",
        start_date: x.start_date ?? null,
        end_date: x.end_date ?? null,
        goal_text: x.goal_text ?? "",
        description: x.description ?? "",
        effort_unit: x.effort_unit ?? "Өдөрт",
        effort_hours: Number(x.effort_hours ?? 0),
        effort_minutes: Number(x.effort_minutes ?? 0),
        frequency: x.frequency ?? null,
      })) ?? [];

    return NextResponse.json({ items: normalized });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "GET_FAILED" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json().catch(() => ({}));

    const { data: auth } = await supabase.auth.getUser();
    const userId = pickUserId(auth?.user?.id ?? null);

    const title: string = String(body?.title || "Зорилгууд");
    const goals: any[] = Array.isArray(body?.goals) ? body.goals : [];

    if (!goals.length) {
      return NextResponse.json({ error: "GOALS_EMPTY" }, { status: 400 });
    }

    // 1) session үүсгэнэ (эсвэл хамгийн сүүлийн session-оо ашиглая)
    const { data: sess } = await supabase
      .from("goal_sessions")
      .insert({ user_id: userId, title })
      .select("id")
      .single();

    const sessionId = sess?.id;

    // 2) items insert
    const rows = goals.map((g) => ({
      user_id: userId,
      session_id: sessionId,

      local_id: g.localId ?? crypto.randomUUID(),
      goal_text: g.goal_text ?? "",
      goal_type: g.goal_type ?? "Хувийн",
      start_date: g.start_date ?? null,
      end_date: g.end_date ?? null,
      description: g.description ?? "",

      effort_unit: g.effort_unit ?? "Өдөрт",
      effort_hours: Number(g.effort_hours ?? 0),
      effort_minutes: Number(g.effort_minutes ?? 0),

      // таны UI: frequency нь одоогоор нэг тоо (dropdown) болсон байгаа
      // хүсвэл дараа нь int[] болгож болно
      frequency: Array.isArray(g.frequency) ? g.frequency?.[0] ?? null : g.frequency ?? null,
    }));

    const { error } = await supabase.from("goal_items").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "POST_FAILED" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json().catch(() => ({}));
    const localId = String(body?.localId || "");
    if (!localId) return NextResponse.json({ error: "MISSING_LOCAL_ID" }, { status: 400 });

    const { data: auth } = await supabase.auth.getUser();
    const userId = pickUserId(auth?.user?.id ?? null);

    const { error } = await supabase
      .from("goal_items")
      .delete()
      .eq("user_id", userId)
      .eq("local_id", localId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "DELETE_FAILED" }, { status: 500 });
  }
}
