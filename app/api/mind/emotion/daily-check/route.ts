import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 60) return "Yellow";
  if (score >= 40) return "Orange";
  return "Red";
}

// ✅ choices id -> 1..5 оноо (сайн -> 5)
function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

function computeScore(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 });
  const impact = pointsFor(answers.impact?.[0] ?? "", { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 });
  const body = pointsFor(answers.body?.[0] ?? "", { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 });
  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 });
  const finish = pointsFor(
    answers.finish?.[0] ?? "",
    { a2: 5, a1: 5, a4: 4, a3: 4, a5: 5 },
    4
  );

  const feelingsIds = answers.feelings ?? [];
  const feelingsAvg =
    feelingsIds.length === 0
      ? 3
      : feelingsIds.reduce(
          (s, id) =>
            s +
            pointsFor(
              id,
              { f5: 5, f4: 5, f7: 4, f8: 3, f6: 2, f3: 2, f2: 1, f1: 1 },
              3
            ),
          0
        ) / feelingsIds.length;

  const identityIds = answers.identity ?? [];
  const identityAvg =
    identityIds.length === 0
      ? 3
      : identityIds.reduce(
          (s, id) => s + pointsFor(id, { p7: 5, p2: 5, p3: 4, p6: 4, p5: 4, p4: 3, p1: 4 }, 3),
          0
        ) / identityIds.length;

  const avg = (mood + impact + body + energy + finish + feelingsAvg + identityAvg) / 7;
  const score100 = Math.round((avg / 5) * 100);
  return Math.max(0, Math.min(100, score100));
}

// ✅ server-side supabase client
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("supabaseUrl is required.");
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

const supabase = createClient(supabaseUrl, serviceKey);

// ✅ ТАНЫ хүснэгтийн нэр:
const TABLE = "daily_emotion_checks";

// ------------------------------------------------------------
// GET: тухайн login user-ийн бүх өдрийн trend-ийг уншина
// ------------------------------------------------------------
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("check_date, score, level")
    .eq("user_id", userId)
    .order("check_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: TrendItem[] = (data ?? []).map((r: any) => ({
    check_date: String(r.check_date),
    score: Number(r.score ?? 0),
    level: (r.level as Level) ?? levelFromScore(Number(r.score ?? 0)),
  }));

  return NextResponse.json({ items });
}

// ------------------------------------------------------------
// POST: тухайн өдрийн хариуг хадгалаад score/level буцаана
// ------------------------------------------------------------
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const check_date = body?.check_date as string | undefined;
  const answers = (body?.answers ?? {}) as Record<string, string[]>;

  const moodChoice = answers?.mood?.[0] ?? body?.mood ?? null;
  const energyChoice = answers?.energy?.[0] ?? body?.energy ?? null;

  if (!check_date) return NextResponse.json({ error: "check_date is required" }, { status: 400 });
  if (!moodChoice) return NextResponse.json({ error: "mood is required" }, { status: 400 });
  if (!energyChoice) return NextResponse.json({ error: "energy is required" }, { status: 400 });

  // ✅ score/level server дээр бодож нэг мөр болгоно
  const score = typeof body?.score === "number" ? body.score : computeScore(answers);
  const level: Level = (body?.level as Level) ?? levelFromScore(score);

  // ✅ Upsert (user_id + check_date давхардвал update)
  // ⚠️ DB дээр UNIQUE(user_id, check_date) constraint байх ёстой.
  const row: any = {
    user_id: userId,
    check_date,
    score,
    level,
    answers, // jsonb
    updated_at: new Date().toISOString(),
  };

  // mood NOT NULL -> өгнө (int 1..5)
  row.mood = pointsFor(String(moodChoice), { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);

  // ✅ energy NOT NULL -> заавал өгнө (int 1..5)
  row.energy = pointsFor(String(energyChoice), { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);

  // --- Хэрвээ танай DB дээр energy нь TEXT (e1..e5) бол дээрх мөрийг comment хийгээд:
  // row.energy = String(energyChoice);

  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "user_id,check_date" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ score, level, check_date });
}
