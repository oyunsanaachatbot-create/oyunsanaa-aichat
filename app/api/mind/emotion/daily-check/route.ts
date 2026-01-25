import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

// ----------------------------
// Scoring helpers (GOOD=5)
// ----------------------------
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function levelFromScore(score: number): Level {
  if (score >= 80) return "Green";
  if (score >= 65) return "Yellow";
  if (score >= 45) return "Orange";
  return "Red";
}

function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

/**
 * Бодит логик:
 * - Mood/Energy/Body: сайн бол өндөр (5)
 * - Impact: сөрөг нөлөөлөл ихсэх тусам stress өснө (5 = их стресс)
 * - Feelings: эерэг/сөрөг дундаж (эерэг -> 5, сөрөг -> 1)
 * - Anxiety: feelings дотор "түгшүүр" (f2) орвол өндөр anxiety
 * - Final score: (wellbeing avg - stress/anxiety penalty) -> 0..100
 */
function computeMetrics(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);

  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // Body: тайван = 5, ядарсан = 1
  const body = pointsFor(answers.body?.[0] ?? "", { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 }, 3);

  // Impact: "маш их нөлөөлсөн" гэдэг нь их дарамт/стресс гэж үзвэл stress=5
  // (чи өөрийн асуултын утгад тааруулж энд л сольж болно)
  const impactId = answers.impact?.[0] ?? "";
  const stress = pointsFor(impactId, { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 }, 3);

  // Feelings mapping (эерэг өндөр, сөрөг бага)
  const feelingsIds = answers.feelings ?? [];
  const feelingPoints = feelingsIds.map((id) =>
    pointsFor(
      id,
      {
        f5: 5, // найдвар
        f4: 5, // амар тайван
        f7: 4, // дулаан хайр
        f8: 3, // эмзэг
        f6: 2, // хоосон
        f3: 2, // уур
        f2: 1, // түгшүүр
        f1: 1, // гуниг
      },
      3
    )
  );
  const feelingsAvg = feelingPoints.length ? feelingPoints.reduce((a, b) => a + b, 0) / feelingPoints.length : 3;

  // Identity (эерэг талдаа)
  const identityIds = answers.identity ?? [];
  const identityPoints = identityIds.map((id) =>
    pointsFor(
      id,
      { p7: 5, p2: 5, p3: 4, p6: 4, p5: 4, p4: 3, p1: 4 },
      3
    )
  );
  const identityAvg = identityPoints.length ? identityPoints.reduce((a, b) => a + b, 0) / identityPoints.length : 3;

  // Finish (өөртөө хэлэх үг) – дэмжих/сэргээх үг бол өндөр
  const finish = pointsFor(
    answers.finish?.[0] ?? "",
    { a1: 5, a2: 5, a5: 5, a3: 4, a4: 4 },
    4
  );

  // Anxiety: feelings дотор f2 байвал өндөр түгшүүр гэж үзнэ
  // (байхгүй бол feelingsAvg-тай ойролцоо)
  const hasAnxiety = feelingsIds.includes("f2");
  const anxiety = hasAnxiety ? 4 : clamp(Math.round(feelingsAvg), 1, 5);

  // Sleep quality: UI-д асуултгүй тул төв (=3)
  const sleep_quality = 3;

  // wellbeing average (good is high)
  const wellbeingAvg = (mood + energy + body + feelingsAvg + identityAvg + finish) / 6;

  // penalty: stress/anxiety өндөр байх тусам оноо унагана
  // stress/anxiety 3 бол penalty бага, 5 бол penalty их
  const penalty = ((stress - 3) + (anxiety - 3)) * 10; // max ~40
  const base = (wellbeingAvg / 5) * 100; // 0..100
  const score = clamp(Math.round(base - penalty), 0, 100);

  return {
    score,
    level: levelFromScore(score),
    mood,
    energy,
    stress,
    anxiety,
    sleep_quality,
  };
}

// ----------------------------
// Supabase (service role)
// ----------------------------
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("supabaseUrl is required.");
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

const supabase = createClient(supabaseUrl, serviceKey);
const TABLE = "daily_emotion_checks";

// ---------------- GET ----------------
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from(TABLE)
    .select("check_date, score, level")
    .eq("user_id", userId)
    .order("check_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: TrendItem[] = (data ?? []).map((r: any) => ({
    check_date: String(r.check_date),
    score: Number(r.score ?? 0),
    level: (r.level as Level) ?? levelFromScore(Number(r.score ?? 0)),
  }));

  return NextResponse.json({ items });
}

// ---------------- POST ----------------
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const check_date = body?.check_date as string | undefined;
  const answers = (body?.answers ?? {}) as Record<string, string[]>;

  if (!check_date) return NextResponse.json({ error: "check_date is required" }, { status: 400 });

  // Гол single-ууд хоосон байвал 400 (500 биш)
  const requiredSingles = ["mood", "impact", "body", "energy", "need", "color", "finish"];
  for (const k of requiredSingles) {
    const v = answers?.[k]?.[0];
    if (!v) return NextResponse.json({ error: `${k} is required` }, { status: 400 });
  }

  const metrics = computeMetrics(answers);

  const row: any = {
    user_id: userId,
    check_date,
    score: metrics.score,
    level: metrics.level,
    mood: metrics.mood,
    energy: metrics.energy,
    stress: metrics.stress,
    anxiety: metrics.anxiety,
    sleep_quality: metrics.sleep_quality,
    answers,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "user_id,check_date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ score: metrics.score, level: metrics.level, check_date });
}
