import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelFromScore(score: number): Level {
  // ✅ Илүү “бодит” босго (доошоо буулгасан)
  if (score >= 80) return "Green";
  if (score >= 65) return "Yellow";
  if (score >= 45) return "Orange";
  return "Red";
}

function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

/**
 * ✅ "БОДИТ" тооцоолол:
 * - Үндсэн: mood + energy + body + impact(ачаалал)  (их нөлөөлнө)
 * - Feelings: баланс (бага нөлөөлнө)
 * - identity/finish: оноонд нөлөөлөхгүй (зөвхөн дүгнэлтийн текстэд)
 */
function computeScore(answers: Record<string, string[]>) {
  // 1..5 (5 = сайн, 1 = муу)

  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);

  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // Body: илүү “бодит” болгож бага өөрчилсөн
  // b2 = чангаралт → дунд (3), b4/b3 = тухгүй/хүнд → 2, b5 = 1
  const body = pointsFor(
    answers.body?.[0] ?? "",
    { b1: 5, b2: 3, b4: 2, b3: 2, b5: 1 },
    3
  );

  // Impact: UI чинь одоо "маш их нөлөөлсөн → огт нөлөөлөөгүй"
  // Үүнийг "ачаалал" гэж үзээд reverse хийж wellbeing болгож авна.
  // i1 (маш их нөлөөлсөн) = 1, i5 (огт нөлөөлөөгүй) = 5
  const impactWellbeing = pointsFor(
    answers.impact?.[0] ?? "",
    { i1: 1, i2: 2, i3: 3, i4: 4, i5: 5 },
    3
  );

  // Feelings баланс (сонгосон 1-3 мэдрэмжийн дундаж)
  // Эерэг: 5, Сөрөг: 1-2
  const feelingsIds = answers.feelings ?? [];
  const feelingsBalance =
    feelingsIds.length === 0
      ? 3
      : feelingsIds.reduce((s, id) => {
          const v = pointsFor(
            id,
            {
              f5: 5, // найдвар
              f4: 5, // амар тайван
              f7: 4, // дулаан
              f8: 3, // эмзэг
              f6: 2, // хоосон
              f3: 2, // уур
              f2: 1, // түгшүүр
              f1: 1, // гуниг
            },
            3
          );
          return s + v;
        }, 0) / feelingsIds.length;

  // ✅ Weight: үндсэн 4 асуулт хамгийн хүчтэй
  const wMood = 0.33;
  const wEnergy = 0.27;
  const wBody = 0.18;
  const wImpact = 0.15;
  const wFeel = 0.07;

  const avg1to5 =
    mood * wMood + energy * wEnergy + body * wBody + impactWellbeing * wImpact + feelingsBalance * wFeel;

  // 1..5 → 0..100 (илүү бодит хүрээ)
  const score100 = Math.round(((avg1to5 - 1) / 4) * 100);
  return clamp(score100, 0, 100);
}

/**
 * ✅ DB-ийн REQUIRED columns (NOT NULL) болох:
 * mood, energy, stress, anxiety, sleep_quality
 * Эднийг answers-оос бодитоор гаргана.
 */
function computeDerived(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);
  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  const body = pointsFor(
    answers.body?.[0] ?? "",
    { b1: 5, b2: 3, b4: 2, b3: 2, b5: 1 },
    3
  );

  // impact → stress (i1 өндөр ачаалал = stress өндөр)
  const impactStress = pointsFor(answers.impact?.[0] ?? "", { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 }, 3);

  // Anxiety: feelings дээрээс “хамгийн өндөр сөрөг” мэдрэмжийг авна
  // f2=түгшүүр хамгийн өндөр, f6=хоосон, f1=гуниг гэх мэт
  const feelings = answers.feelings ?? [];
  const anxietyFromFeelings =
    feelings.length === 0
      ? 3
      : clamp(
          Math.max(
            ...feelings.map((id) =>
              pointsFor(
                id,
                {
                  f2: 5, // түгшүүр
                  f6: 4, // хоосон
                  f1: 4, // гуниг
                  f3: 3, // уур
                  f8: 3, // эмзэг
                  f5: 1, // найдвар (сөрөг биш)
                  f4: 1, // амар тайван
                  f7: 1, // дулаан
                },
                3
              )
            )
          ),
          1,
          5
        );

  // Stress: impactStress + (energy бага) + (mood бага) нийлбэрийг дундажлаад 1..5
  const stress = clamp(Math.round((impactStress + (6 - energy) + (6 - mood)) / 3), 1, 5);

  // Sleep_quality: energy + body дундаж (ихэнхдээ логик таардаг)
  const sleep_quality = clamp(Math.round((energy + body) / 2), 1, 5);

  // Anxiety: feelings-с хүчтэй гарч ирвэл тэрийг авна, үгүй бол стресс дээр түшиглэнэ
  const anxiety = clamp(Math.round((anxietyFromFeelings * 0.7 + stress * 0.3)), 1, 5);

  return { mood, energy, stress, anxiety, sleep_quality };
}

// ✅ server-side supabase client
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("supabaseUrl is required.");
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

const supabase = createClient(supabaseUrl, serviceKey);

// ✅ table
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

  // ✅ required answers (UI дээр бүх асуултаа бөглүүлэх гэж байгаа бол бүгдийг шаард)
  const requiredSingles = ["mood", "impact", "body", "energy", "need", "color", "finish"];
  for (const k of requiredSingles) {
    const v = answers?.[k]?.[0];
    if (!v) return NextResponse.json({ error: `${k} is required` }, { status: 400 });
  }
  if (!answers?.feelings || answers.feelings.length === 0) {
    return NextResponse.json({ error: "feelings is required" }, { status: 400 });
  }
  if (!answers?.identity || answers.identity.length === 0) {
    return NextResponse.json({ consider: "identity not selected" }); // хүсвэл required болго
  }

  const score = computeScore(answers);
  const level: Level = levelFromScore(score);

  const derived = computeDerived(answers);

  const row: any = {
    user_id: userId,
    check_date,
    score,
    level,
    answers, // jsonb
    updated_at: new Date().toISOString(),

    // ✅ REQUIRED columns in DB (NOT NULL)
    mood: derived.mood,
    energy: derived.energy,
    stress: derived.stress,
    anxiety: derived.anxiety,
    sleep_quality: derived.sleep_quality,
  };

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "user_id,check_date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    score,
    level,
    check_date,
    // ✅ debug хэрэгтэй бол UI дээр харахад ашиглаж болно
    derived,
  });
}
