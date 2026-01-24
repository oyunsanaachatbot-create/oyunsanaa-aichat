// app/(chat)/api/balance/run/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DomainScore = { domain: string; label: string; score100: number };
type BalanceResult = {
  totalScore100: number;
  answeredCount: number;
  totalCount: number;
  domainScores: DomainScore[];
};

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      result?: BalanceResult;
      answers?: Record<string, number>;
      at?: number;
    };

    const userId = String(body.userId ?? "guest");
    const result = body.result;
    const answers = body.answers ?? null;
    const at = Number(body.at ?? Date.now());

    if (!result) {
      return NextResponse.json({ ok: false, error: "Missing result" }, { status: 400 });
    }

    // ✅ env-г зөвхөн энд уншина (build дээр унахгүй)
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "";

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      "";

    if (!supabaseUrl) throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ⬇️ Хадгалах хүснэгтийн нэр: balance_runs (доор SQL өгнө)
    const { error } = await supabase.from("balance_runs").insert({
      user_id: userId,
      at,
      total_score_100: result.totalScore100,
      answered_count: result.answeredCount,
      total_count: result.totalCount,
      domain_scores: result.domainScores,
      answers,
      result,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
