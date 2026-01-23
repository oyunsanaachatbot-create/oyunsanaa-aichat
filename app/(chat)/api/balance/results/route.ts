import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth"; // танайд next-auth auth() ийм байдлаар байвал
// Хэрэв өөр бол тааруулна.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ server only
);

function requireEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

export async function POST(req: Request) {
  requireEnv();

  const session = await auth();
  const userId = session?.user?.id; // ✅ таны next-auth user.id (uuid) гэж үзэв

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { answers, result } = body ?? {};

  if (!answers || !result) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const insertPayload = {
    user_id: userId,
    overall_score: result.overallScore,
    domain_scores: result.domains,
    answers,
  };

  const { error } = await supabaseAdmin.from("balance_results").insert(insertPayload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  requireEnv();

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ rows: [] }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("balance_results")
    .select("id, created_at, overall_score, domain_scores")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}
