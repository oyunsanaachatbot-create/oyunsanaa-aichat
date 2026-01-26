import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 60) return "Yellow";
  if (score >= 40) return "Orange";
  return "Red";
}

function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

/**
 * ✅ "САЙН -> 5", "МУУ -> 1" зарчим
 * impact: "маш их нөлөөлсөн" = стресс их => оноо БАГА (1) байх ёстой
 */
function computeScore(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);

  // ✅ impact reverse (stress)
  const impact = pointsFor(answers.impact?.[0] ?? "", { i1: 1, i2: 2, i3: 3, i4: 4, i5: 5 }, 3);

  const body = pointsFor(answers.body?.[0] ?? "", { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 }, 3);
  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // finish бүгд дэмжих өгүүлбэрүүд тул өндөр, гэхдээ бүгд 5 биш (арай ялгаатай)
  const finish = pointsFor(answers.finish?.[0] ?? "", { a2: 4, a1: 5, a4: 4, a3: 4, a5: 5 }, 4);

  const feelingsIds = answers.feelings ?? [];
  const feelingsAvg =
    feelingsIds.length === 0
      ? 3
      : feelingsIds.reduce(
          (s, id) =>
            s +
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
            ),
          0
        ) / feelingsIds.length;

  const identityIds = answers.identity ?? [];
  const identityAvg =
    identityIds.length === 0
      ? 3
      : identityIds.reduce(
          (s, id) =>
            s +
            pointsFor(
              id,
              {
                p7: 5,
                p2: 5,
                p6: 5,
                p5: 5,
                p3: 4,
                p4: 4,
                p1: 4,
              },
              3
            ),
          0
        ) / identityIds.length;

  // ⚠️ color нь “дүрслэл” тул оноонд оруулахгүй (нейтрал 3 гэж үзнэ)
  const color = 3;

  // 7 зүйл дээр дундажлана (color нейтрал)
  const avg = (mood + impact + body + energy + finish + feelingsAvg + identityAvg + color) / 8;
  const score100 = Math.round((avg / 5) * 100);
  return clamp(score100, 0, 100);
}

// ✅ server-side supabase client
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

  // ✅ required (DB дээр NOT NULL тул UI-гээс заавал ирнэ)
  const moodChoice = answers?.mood?.[0];
  const energyChoice = answers?.energy?.[0];
  const impactChoice = answers?.impact?.[0];

  if (!moodChoice) return NextResponse.json({ error: "mood is required" }, { status: 400 });
  if (!energyChoice) return NextResponse.json({ error: "energy is required" }, { status: 400 });
  if (!impactChoice) return NextResponse.json({ error: "impact is required" }, { status: 400 });

  const score = computeScore(answers);
  const level: Level = levelFromScore(score);

  // ✅ DB баганууд: mood, energy, stress, anxiety, sleep_quality бүгд NOT NULL
  const row: any = {
    user_id: userId,
    check_date,
    score,
    level,
    answers,
    updated_at: new Date().toISOString(),
  };

  row.mood = pointsFor(String(moodChoice), { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);
  row.energy = pointsFor(String(energyChoice), { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // ✅ stress = impact reverse (i1 стресс их -> 5)
  row.stress = pointsFor(String(impactChoice), { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 }, 3);

  // UI дээр асуулт одоохондоо байхгүй => default
  row.anxiety = 3;
  row.sleep_quality = 3;

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "user_id,check_date" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ score, level, check_date });
}
