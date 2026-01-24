import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@app/(auth)/auth";
import { supabase } from "@/lib/supabaseClient";

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
  const pos = (x: number) => x - 1; // 1..5 -> 0..4
  const neg = (x: number) => 5 - x; // reverse

  const raw =
    pos(v.mood) * 3 +
    pos(v.energy) * 2 +
    pos(v.sleep_quality) * 2 +
    neg(v.stress) * 2 +
    neg(v.anxiety) * 1;

  const score = Math.round((raw / 40) * 100);

  let level: "Green" | "Yellow" | "Orange" | "Red" = "Green";
  if (score < 35) level = "Red";
  else if (score < 55) level = "Orange";
  else if (score < 75) level = "Yellow";

  return { score, level };
}

async function requireUserId() {
  const session = await auth();
  const userId = (session as any)?.user?.id;
  return userId ? String(userId) : null;
}

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 365);

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
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const v = parsed.data;
  const { score, level } = calcScoreAndLevel(v);

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
