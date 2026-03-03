// app/api/health/daily/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day"); // yyyy-mm-dd
  if (!day) return NextResponse.json({ error: "Missing day" }, { status: 400 });

  const sb = supabaseAdmin();

  const logRes = await sb
    .from("health_daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("day", day)
    .single();

  const mealsRes = await sb
    .from("health_meals")
    .select("*")
    .eq("user_id", userId)
    .eq("day", day)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    log: logRes.data ?? null,
    meals: mealsRes.data ?? [],
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.day) return NextResponse.json({ error: "Missing day" }, { status: 400 });

  const sb = supabaseAdmin();
  const payload = {
    user_id: userId,
    day: body.day,
    water_liters: body.waterLiters ?? null,
    steps: body.steps ?? null,
    sleep_hours: body.sleepHours ?? null,
    mood: body.mood ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("health_daily_logs")
    .upsert(payload, { onConflict: "user_id,day" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
