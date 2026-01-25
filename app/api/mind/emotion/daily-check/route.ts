import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@supabase/supabase-js";

type Level = "Green" | "Yellow" | "Orange" | "Red";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  // Server side тул SERVICE ROLE хэрэглэнэ (RLS асаасан ч ажиллана)
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clamp1to5(n: number) {
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

function computeScore100(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);
  const impact = pointsFor(answers.impact?.[0] ?? "", { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 }, 3);
  const body = pointsFor(answers.body?.[0] ?? "", { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 }, 3);
  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);
  const finish = pointsFor(
    answers.finish?.[0] ?? "",
    { a2: 5, a1: 5, a4: 4, a3: 4, a5: 5 },
    4
  );

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

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ items: [] });

  // Сүүлийн 120 мөрийг авч календарь дээр харуулна
  const { data, error } = await supabase
    .from("daily_emotion_checks")
    .select("check_date, score, level")
    .eq("user_id", userId)
    .order("check_date", { ascending: true })
    .limit(120);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data ?? []).map((x: any) => ({
      check_date: String(x.check_date),
      score: Number(x.score ?? 0),
      level: x.level as Level,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const check_date = String(body?.check_date ?? "");
    const answers = (body?.answers ?? {}) as Record<string, string[]>;

    if (!check_date) return NextResponse.json({ error: "check_date required" }, { status: 400 });

    // ✅ Supabase column-ууд NOT NULL тул заавал утга өгнө (fallback=3)
    const mood = clamp1to5(pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3));
    const energy = clamp1to5(pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3));

    // Танай table дээр "stress" байгаа (screenshot дээр харагдсан). Бид impact-оос stress гаргая:
    // impact сайн (i1) бол stress бага, impact муу (i5) бол stress өндөр.
    const impactPoint = pointsFor(answers.impact?.[0] ?? "", { i1: 1, i2: 2, i3: 3, i4: 4, i5: 5 }, 3);
    const stress = clamp1to5(impactPoint);

    const score = computeScore100(answers);
    const level = levelFromScore(score);

    // ✅ Upsert: тухайн өдөр дахиж бөглөвөл overwrite
    const { error } = await supabase
      .from("daily_emotion_checks")
      .upsert(
        {
          user_id: userId,
          check_date,
          mood,
          energy,
          stress,
          score,
          level,
          answers, // jsonb
        },
        { onConflict: "user_id,check_date" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ score, level });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
