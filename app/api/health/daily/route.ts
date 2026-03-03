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
  const { data, error } = await sb
    .from("health_daily_logs")
    .select("date,items,totals")
    .eq("user_id", userId)
    .eq("date", day)
    .single();

  if (error && (error as any).code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log: data ?? null });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.day) return NextResponse.json({ error: "Missing day" }, { status: 400 });

  const sb = supabaseAdmin();

  const row = {
    user_id: userId,
    date: body.day,
    items: {
      waterLiters: body.waterLiters ?? null,
      steps: body.steps ?? null,
      sleepHours: body.sleepHours ?? null,
      mood: body.mood ?? null,
    },
    // totals-г дараа өргөжүүлж болно. Одоохондоо хоосон үлдээе.
    totals: body.totals ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("health_daily_logs")
    .upsert(row, { onConflict: "user_id,date" })
    .select("date,items,totals")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
