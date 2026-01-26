import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// 0..100 -> level
function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 60) return "Yellow";
  if (score >= 40) return "Orange";
  return "Red";
}

function pick1(answers: Record<string, string[]>, key: string) {
  return answers?.[key]?.[0] ?? "";
}

// id -> 1..5 оноо
function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

/**
 * БОДИТ СКОРЫН ЛОГИК (чиний хүсэлтээр):
 * - "сайн" сонголтууд = 5
 * - "муу" сонголтууд = 1
 * - impact: "маш их нөлөөлсөн" = сөрөг стресс өндөр гэж үзээд БАГА оноо
 * - feelings: олон сонгосон үед НЭМЭХ биш, ДУНДАЖ (average)
 * - finish: жаахан +/− нөлөөлөл (сэтгэлзүйн урам)
 */
function computeScore(answers: Record<string, string[]>) {
  // 1) mood (сайн -> 5, муу -> 1)
  const mood = pointsFor(pick1(answers, "mood"), { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);

  // 2) impact (энд "маш их нөлөөлсөн" = стресс их => муу)
  // i1..i5 чинь UI дээрээ тийм дарааллаар байгаагаас үл хамаараад ЭНД ингэж оноо өгнө:
  const impact = pointsFor(pick1(answers, "impact"), { i1: 1, i2: 2, i3: 3, i4: 4, i5: 5 }, 3);

  // 3) body (тайван=5, ядарсан=1)
  const body = pointsFor(pick1(answers, "body"), { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 }, 3);

  // 4) energy (эрч хүч=5, маш ядарсан=1)
  const energy = pointsFor(pick1(answers, "energy"), { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // 5) feelings (multi) — НЭМЭХГҮЙ, ДУНДАЖЛАХ
  // Сайн мэдрэмжүүд өндөр, хүнд мэдрэмжүүд бага оноо
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
                f8: 3, // эмзэглэл (дунд)
                f6: 2, // хоосон
                f3: 2, // уур
                f2: 1, // түгшүүр
                f1: 1, // гуниг
              },
              3
            ),
          0
        ) / feelingsIds.length;

  // 6) finish (single) — багахан “өөрийгөө дэмжих” бонус
  // (Гэхдээ хэт их нөлөөлүүлэхгүй)
  const finish = pointsFor(pick1(answers, "finish"), { a2: 4, a1: 5, a4: 4, a3: 4, a5: 5 }, 4);

  // ---------- ЖИН (weights) ----------
  // mood/impact/body/energy хамгийн гол
  const wMood = 0.24;
  const wImpact = 0.20;
  const wBody = 0.18;
  const wEnergy = 0.18;
  const wFeel = 0.16;
  const wFinish = 0.04;

  const weighted =
    mood * wMood +
    impact * wImpact +
    body * wBody +
    energy * wEnergy +
    feelingsAvg * wFeel +
    finish * wFinish;

  // weighted нь 1..5 орчим гарна.
  // 1 -> 0, 5 -> 100 болгож хөрвүүлнэ:
  const score100 = Math.round(((weighted - 1) / 4) * 100);

  return clamp(score100, 0, 100);
}

// ✅ server-side supabase client
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("supabaseUrl is required.");
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

const supabase = createClient(supabaseUrl, serviceKey);

// ✅ Table name
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

  const moodChoice = pick1(answers, "mood");
  const energyChoice = pick1(answers, "energy");
  const impactChoice = pick1(answers, "impact");

  // ✅ UI дээр хоосон бол 400
  if (!moodChoice) return NextResponse.json({ error: "mood is required" }, { status: 400 });
  if (!energyChoice) return NextResponse.json({ error: "energy is required" }, { status: 400 });
  if (!impactChoice) return NextResponse.json({ error: "impact is required" }, { status: 400 });

  // ✅ шинэ бодит score
  const score = computeScore(answers);
  const level: Level = levelFromScore(score);

  // ✅ DB NOT NULL баганууд бүгд утгатай байна
  const row: any = {
    user_id: userId,
    check_date,
    score,
    level,
    answers,
    updated_at: new Date().toISOString(),
  };

  // mood/energy чинь smallint NOT NULL -> 1..5 болгоод хадгална
  row.mood = pointsFor(moodChoice, { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);
  row.energy = pointsFor(energyChoice, { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // stress (NOT NULL) -> impact-оос гаргана (i1 хамгийн их нөлөө = стресс өндөр = 5)
  row.stress = pointsFor(impactChoice, { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 }, 3);

  // UI дээр асуулт байхгүй тул default (NOT NULL)
  row.anxiety = 3;
  row.sleep_quality = 3;

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "user_id,check_date" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ score, level, check_date });
}
