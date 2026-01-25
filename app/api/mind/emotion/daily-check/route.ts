import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";

function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

function computeScore(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 });
  const impact = pointsFor(answers.impact?.[0] ?? "", { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 });
  const body = pointsFor(answers.body?.[0] ?? "", { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 });
  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 });
  const finish = pointsFor(answers.finish?.[0] ?? "", { a2: 5, a1: 5, a4: 4, a3: 4, a5: 5 }, 4);

  const feelingsIds = answers.feelings ?? [];
  const feelingsAvg =
    feelingsIds.length === 0
      ? 3
      : feelingsIds.reduce((s, id) => s + pointsFor(id, { f5: 5, f4: 5, f7: 4, f8: 3, f6: 2, f3: 2, f2: 1, f1: 1 }, 3), 0) /
        feelingsIds.length;

  const identityIds = answers.identity ?? [];
  const identityAvg =
    identityIds.length === 0
      ? 3
      : identityIds.reduce((s, id) => s + pointsFor(id, { p7: 5, p2: 5, p3: 4, p6: 4, p5: 4, p4: 3, p1: 4 }, 3), 0) /
        identityIds.length;

  const avg = (mood + impact + body + energy + finish + feelingsAvg + identityAvg) / 7;
  const score100 = Math.round((avg / 5) * 100);
  return Math.max(0, Math.min(100, score100));
}

function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 60) return "Yellow";
  if (score >= 40) return "Orange";
  return "Red";
}

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing SUPABASE env vars");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email ?? null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("daily_emotion_checks")
      .select("check_date, score, level")
      .eq("user_id", String(userId))
      .order("check_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "GET failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? session?.user?.email ?? null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const answers = (body?.answers ?? {}) as Record<string, string[]>;
    const check_date = (body?.check_date ?? todayISO()) as string;

    const score = computeScore(answers);
    const level = levelFromScore(score);

    const supabase = getAdminSupabase();
    const { error } = await supabase.from("daily_emotion_checks").upsert(
      {
        user_id: String(userId),
        check_date,
        score,
        level,
        answers,
      },
      { onConflict: "user_id,check_date" }
    );

    if (error) throw error;

    return NextResponse.json({ check_date, score, level });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "POST failed" }, { status: 500 });
  }
}
