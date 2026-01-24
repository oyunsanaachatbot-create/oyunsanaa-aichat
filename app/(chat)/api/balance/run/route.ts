import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ server дээр л байна
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // body: { userId, result }
    const userId = String(body.userId || "");
    const r = body.result || {};
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const payload = {
      user_id: userId,
      total_score100: Number(r.totalScore100 ?? 0),
      answered_count: Number(r.answeredCount ?? 0),
      total_count: Number(r.totalCount ?? 0),
      domain_scores: r.domainScores ?? [],
    };

    const { error } = await supabase.from("balance_runs").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = String(searchParams.get("userId") || "");
  if (!userId) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("balance_runs")
    .select("created_at,total_score100,domain_scores")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ items: [], error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
