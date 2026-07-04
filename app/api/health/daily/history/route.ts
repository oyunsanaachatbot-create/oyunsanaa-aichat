// app/api/health/daily/history/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days")) || 7));

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceYmd = since.toISOString().slice(0, 10);

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("health_daily_logs")
    .select("date,items,totals")
    .eq("user_id", userId)
    .gte("date", sinceYmd)
    .order("date", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data ?? [] });
}
