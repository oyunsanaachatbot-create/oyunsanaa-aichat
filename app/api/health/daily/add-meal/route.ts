import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function sumTotals(items: any[]) {
  const t = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fibre_g: 0,
    sugar_g: 0,
    water_l: 0,
    steps: 0,
    sleep_h: 0,
  };
  for (const m of items) {
    t.calories += Number(m.calories ?? 0);
    t.protein_g += Number(m.protein_g ?? 0);
    t.carbs_g += Number((m.good_carbs_g ?? 0) + (m.bad_carbs_g ?? 0));
    t.fat_g += Number(m.fat_g ?? 0);
    t.fibre_g += Number(m.fibre_g ?? 0);
    t.sugar_g += Number(m.sugar_g ?? 0);
  }
  return t;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "UNAUTH" }, { status: 401 });

  const body = await req.json();
  const { date, meal } = body ?? {};
  if (!date || !meal) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // 1) одоогийн өдрийн лог авч үзнэ
  const { data: existing, error: exErr } = await supabase
    .from("health_daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  const items = Array.isArray(existing?.items) ? existing!.items : [];
  const nextItems = [
    ...items,
    { ...meal, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
  ];
  const totals = sumTotals(nextItems);

  const upsertPayload = {
    user_id: userId,
    date,
    items: nextItems,
    totals,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("health_daily_logs")
    .upsert(upsertPayload, { onConflict: "user_id,date" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}
