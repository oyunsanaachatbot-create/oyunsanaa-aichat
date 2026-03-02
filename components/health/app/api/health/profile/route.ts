import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"; // танайд байгаа гэж үзэв

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTH" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTH" }, { status: 401 });

  const body = await req.json();
  const { payload, targets } = body ?? {};
  if (!payload || !targets) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("health_profiles")
    .upsert(
      {
        user_id: userId,
        payload,
        target_calories: targets.calories,
        target_protein_g: targets.protein_g,
        target_carbs_g: targets.carbs_g,
        target_fat_g: targets.fat_g,
        target_water_l: targets.water_l,
        target_steps: targets.steps,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
