// app/api/health/profile/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("health_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const sb = supabaseAdmin();
  const payload = {
    user_id: userId,
    start_date: body.startDate || null,
    sex: body.sex || null,
    age: body.age ?? null,
    height_cm: body.heightCm ?? null,
    weight_kg: body.weightKg ?? null,
    care_level: body.careLevel || null,
    diet_type: body.dietType || null,
    meals_per_day: body.mealsPerDay || null,
    exercise_freq: body.exerciseFreq || null,
    walking_level: body.walkingLevel || null,
    alcohol_freq: body.alcoholFreq || null,
    smoking_level: body.smokingLevel || null,
    me_time: body.meTime || null,
    sleep_hours: body.sleepHours || null,
    sleep_time: body.sleepTime || null,
    updated_at: new Date().toISOString(),
  };

  // upsert by user_id
  const { data, error } = await sb
    .from("health_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
