// app/api/health/profile/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeTargets } from "@/components/health/calc";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("health_profiles")
    .select("payload,target_calories,target_protein_g,target_carbs_g,target_fat_g,target_water_l,target_steps")
    .eq("user_id", userId)
    .single();

  // PGRST116 = no rows
  if (error && (error as any).code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();

  // хуучин кодын логикийг эндээс бодно
  const t = computeTargets(payload);

  const sb = supabaseAdmin();
  const upsertPayload = {
    user_id: userId,
    payload,
    target_calories: t.targetCalories,
    target_protein_g: t.targetProteinG,
    target_carbs_g: t.targetCarbsG,
    target_fat_g: t.targetFatG,
    target_water_l: t.targetWaterL,
    target_steps: t.targetSteps,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("health_profiles")
    .upsert(upsertPayload, { onConflict: "user_id" })
    .select("payload,target_calories,target_protein_g,target_carbs_g,target_fat_g,target_water_l,target_steps")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data, targets: t });
}
