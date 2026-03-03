// app/api/health/daily/add-meal/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { day, mealType, title, calories, proteinG, carbsG, fatG } = body || {};
  if (!day || !mealType || !title) {
    return NextResponse.json({ error: "Missing day/mealType/title" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("health_meals")
    .insert({
      user_id: userId,
      day,
      meal_type: mealType,
      title,
      calories: calories ?? null,
      protein_g: proteinG ?? null,
      carbs_g: carbsG ?? null,
      fat_g: fatG ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meal: data });
}
