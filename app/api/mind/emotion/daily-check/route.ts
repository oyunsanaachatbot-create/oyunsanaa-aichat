import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // танайд байгаа authOptions path-аа тааруул
import { createClient } from "@/lib/supabase/server"; // танайд байгаа server supabase client path-аа тааруул

const BodySchema = z.object({
  check_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  anxiety: z.number().int().min(1).max(5),
  sleep_quality: z.number().int().min(1).max(5),
  note: z.string().max(2000).optional().default(""),
  tags: z.array(z.string().min(1).max(24)).max(8).optional().default([]),
});

function calcScoreAndLevel(v: z.infer<typeof BodySchema>) {
  // 1..5 -> 0..4
  const pos = (x: number) => x - 1;
  const neg = (x: number) => 5 - x; // reverse (1->4,5->0)

  // жинлэлт (хялбар, мэргэжлийн мэдрэмжтэй)
  const raw =
    pos(v.mood) * 3 +
    pos(v.energy) * 2 +
    pos(v.sleep_quality) * 2 +
    neg(v.stress) * 2 +
    neg(v.anxiety) * 1;

  // max raw: (4*3)+(4*2)+(4*2)+(4*2)+(4*1)=12+8+8+8+4=40
  const score = Math.round((raw / 40) * 100);

  let level: "Green" | "Yellow" | "Orange" | "Red" = "Green";
  if (score < 35) level = "Red";
  else if (score < 55) level = "Orange";
  else if (score < 75) level = "Yellow";

  return { score, level };
}

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id; // танайд user.id байдаг гэж үзэв
  if (!userId) return null;
  return userId as string;
}

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 365);

  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceISO = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_emotion_checks")
    .select("check_date,mood,energy,stress,anxiety,sleep_quality,score,level,note,tags")
    .eq("user_id", userId)
    .gte("check_date", sinceISO)
    .order("check_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const v = parsed.data;
  const { score, level } = calcScoreAndLevel(v);

  const supabase = createClient();
  const payload = {
    user_id: userId,
    check_date: v.check_date,
    mood: v.mood,
    energy: v.energy,
    stress: v.stress,
    anxiety: v.anxiety,
    sleep_quality: v.sleep_quality,
    note: v.note ?? "",
    tags: v.tags ?? [],
    score,
    level,
  };

  const { data, error } = await supabase
    .from("daily_emotion_checks")
    .upsert(payload, { onConflict: "user_id,check_date" })
    .select("check_date,score,level")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, saved: data });
}
