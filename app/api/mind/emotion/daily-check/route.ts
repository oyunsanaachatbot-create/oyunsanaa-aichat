import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ танайд байгаа NextAuth-ийн auth export (ихэнхдээ энэ замаар байдаг)
import { auth } from "@/app/(auth)/auth";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// ✅ жижигхэн score: mood + impact + energy дээр суурилуулъя (0..100)
// энэ нь зөвхөн "level" гаргахын тулд, дараа нь сайжруулж болно
function calcScore(answers: Record<string, string[]>) {
  const one = (k: string) => (answers[k]?.[0] ?? null);

  const mood = one("mood");     // m1..m5
  const impact = one("impact"); // i1..i5
  const energy = one("energy"); // e1..e5

  const map5 = (id: string | null, prefix: string) => {
    if (!id) return 2; // default дундаж
    const n = Number(id.replace(prefix, ""));
    if (!Number.isFinite(n)) return 2;
    return Math.min(4, Math.max(0, n - 1)); // 0..4
  };

  const moodV = map5(mood, "m");       // 0..4
  const energyV = map5(energy, "e");   // 0..4
  const impactV = 4 - map5(impact, "i"); // i1=0.. i5=4 → эерэг бол өндөр оноо

  const raw = moodV * 3 + energyV * 2 + impactV * 2; // max 4*7=28
  const score = Math.round((raw / 28) * 100);

  const level =
    score < 35 ? "Red" :
    score < 55 ? "Orange" :
    score < 75 ? "Yellow" : "Green";

  return { score, level };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Нэвтэрч ороод дахин оролдоорой." }, { status: 401 });
    }

    const body = await req.json();
    const check_date: string = body.check_date;
    const answers: Record<string, string[]> = body.answers ?? {};

    if (!check_date) {
      return NextResponse.json({ error: "check_date байхгүй байна" }, { status: 400 });
    }

    const { score, level } = calcScore(answers);

    const sb = supabaseAdmin();

    // upsert: user_id + check_date unique index чинь байгаа гэж үзнэ
    const { error } = await sb
      .from("daily_emotion_checks")
      .upsert(
        {
          user_id: String(userId),
          check_date,
          // legacy numeric columns-д түр 3 хийж болох ч хэрэггүй, хүсвэл дараа салгана.
          mood: 3,
          energy: 3,
          stress: 3,
          anxiety: 3,
          sleep_quality: 3,
          note: null,
          tags: [],
          answers,        // ✅ jsonb багана
          score,
          level,
        },
        { onConflict: "user_id,check_date" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, score, level });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();

    const fromISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await sb
      .from("daily_emotion_checks")
      .select("check_date, score, level, answers, created_at")
      .eq("user_id", String(userId))
      .gte("check_date", fromISO)
      .order("check_date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
