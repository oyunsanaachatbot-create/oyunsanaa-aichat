import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 60) return "Yellow";
  if (score >= 40) return "Orange";
  return "Red";
}

// choice id -> 1..5 (GOOD=5, BAD=1)
function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

function avg(arr: number[]) {
  if (!arr.length) return 3;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * ✅ “Бодит” оноо:
 * - mood / energy / body: сайн->5 муу->1
 * - impact: "маш их нөлөөлсөн" нь ихэвчлэн stress өндөр => оноо бууруулна (i1=1 ... i5=5)
 * - feelings: эерэгүүд өндөр, сөрөгүүд бага
 * - finish: дэмжлэгтэй өгүүлбэрүүд бүгд эерэг тул ялгаа бага (baseline)
 */
function computeScore(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);

  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  const body = pointsFor(
    answers.body?.[0] ?? "",
    {
      b1: 5, // тайван
      b2: 3, // чангарсан
      b4: 2, // тухгүй
      b3: 2, // хүнд дарамт
      b5: 1, // ядарсан
    },
    3
  );

  // ✅ impact: их нөлөөлөх тусам стресс өндөр => оноо буурна
  const impact = pointsFor(answers.impact?.[0] ?? "", { i1: 1, i2: 2, i3: 3, i4: 4, i5: 5 }, 3);

  // feelings multi
  const feelingsIds = answers.feelings ?? [];
  const feelings = avg(
    feelingsIds.map((id) =>
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
    )
  );

  // identity multi (ерөнхийдөө дэмжлэгтэй)
  const identityIds = answers.identity ?? [];
  const identity = avg(
    identityIds.map((id) =>
      pointsFor(
        id,
        {
          p7: 5,
          p2: 4,
          p3: 4,
          p6: 4,
          p5: 4,
          p4: 3,
          p1: 4,
        },
        3
      )
    )
  );

  // finish (ихэнх нь эерэг тул хэт “оноо өсгөхгүй” байхаар)
  const finish = pointsFor(
    answers.finish?.[0] ?? "",
    { a1: 4, a2: 4, a3: 4, a4: 4, a5: 4 },
    4
  );

  // ✅ жин (mood/energy/impact их нөлөөтэй)
  const weighted =
    mood * 0.22 +
    energy * 0.20 +
    impact * 0.20 +
    body * 0.14 +
    feelings * 0.14 +
    identity * 0.06 +
    finish * 0.04;

  const score100 = Math.round((weighted / 5) * 100);
  return clamp(score100, 0, 100);
}

// ---- supabase server client
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

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const check_date = body?.check_date as string | undefined;
  const answers = (body?.answers ?? {}) as Record<string, string[]>;

  if (!check_date) return NextResponse.json({ error: "check_date is required" }, { status: 400 });

  // ✅ хамгийн чухал 3 нь хоосон бол UI дээр алдаа гаргаж буцаана (500 болгохгүй)
  const moodChoice = answers?.mood?.[0] ?? null;
  const energyChoice = answers?.energy?.[0] ?? null;
  const impactChoice = answers?.impact?.[0] ?? null;

  if (!moodChoice) return NextResponse.json({ error: "mood is required" }, { status: 400 });
  if (!energyChoice) return NextResponse.json({ error: "energy is required" }, { status: 400 });
  if (!impactChoice) return NextResponse.json({ error: "impact is required" }, { status: 400 });

  const score = computeScore(answers);
  const level: Level = levelFromScore(score);

  // ✅ DB дээр чинь эдгээр нь NOT NULL байгаа (stress/anxiety/sleep_quality гэх мэт)
  // Тиймээс энд ЗААВАЛ утга онооно.
  const mood = pointsFor(String(moodChoice), { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);
  const energy = pointsFor(String(energyChoice), { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // stress: impact их байх тусам stress өндөр гэж үзье (i1 хамгийн өндөр stress)
  const stress = pointsFor(String(impactChoice), { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 }, 3);

  // anxiety: feelings дээр f2 (түгшүүр) байвал өндөр
  const feelings = answers.feelings ?? [];
  const anxiety =
    feelings.includes("f2") ? 5 : feelings.includes("f6") || feelings.includes("f1") ? 4 : 3;

  // sleep_quality: асуулт байхгүй тул “дундаж” default
  const sleep_quality = 3;

  const row: any = {
    user_id: userId,
    check_date,
    mood,
    energy,
    stress,
    anxiety,
    sleep_quality,
    score,
    level,
    answers, // jsonb байж болно
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "user_id,check_date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ score, level, check_date });
}
