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

  // health_daily_logs дээр баганын нэр нь "date"
  const logRes = await sb
    .from("health_daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", day)
    .single();

  // health_meals table чинь байгаа эсэх нь тодорхойгүй.
  // Хэрвээ байхгүй бол энэ query алдаа өгнө — safe байдлаар try/catch хийнэ.
  let meals: any[] = [];
  try {
    const mealsRes = await sb
      .from("health_meals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", day)
      .order("created_at", { ascending: true });
    meals = mealsRes.data ?? [];
  } catch {
    meals = [];
  }

  return NextResponse.json({
    log: logRes.data ?? null,
    meals,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.day) return NextResponse.json({ error: "Missing day" }, { status: 400 });

  const sb = supabaseAdmin();

  // Чиний хүснэгт дээр totals/items jsonb байгаа тул тэрийг ашиглая.
  // (UI-гээс water/steps/sleep/mood явуулж байвал items дотор хадгална)
  const payload = {
    user_id: userId,
    date: body.day,
    items: {
      waterLiters: body.waterLiters ?? null,
      steps: body.steps ?? null,
      sleepHours: body.sleepHours ?? null,
      mood: body.mood ?? null,
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("health_daily_logs")
    .upsert(payload, { onConflict: "user_id,date" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
