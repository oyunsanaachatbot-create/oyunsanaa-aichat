import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ энэ файл чинь байгаа бол

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as any)?.id; // ✅ танайд user.id байдаг гэж үзэв
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { answers, result } = body ?? {};
  if (!answers || !result) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { error } = await supabaseAdmin.from("balance_results").insert({
    user_id: userId,
    overall_score: result.overallScore,
    domain_scores: result.domains,
    answers,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ rows: [] });

  const { data, error } = await supabaseAdmin
    .from("balance_results")
    .select("id, created_at, overall_score, domain_scores")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
