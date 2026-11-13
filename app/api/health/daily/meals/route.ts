import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");
  if (!day) return NextResponse.json({ error: "Missing day" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("health_meals")
    .select("id,meal_type,title,calories,protein_g,carbs_g,fat_g")
    .eq("user_id", userId)
    .eq("day", day)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meals: data ?? [] });
}
