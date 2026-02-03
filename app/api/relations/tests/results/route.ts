import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  test_slug: string;
  test_title: string;
  score_pct: number; // 0-100
  band_title: string | null;
  band_summary: string | null;
  answers: Array<number | null>;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.test_slug || !body?.test_title) {
    return NextResponse.json({ error: "Missing test fields" }, { status: 400 });
  }

  const scorePct =
    typeof body.score_pct === "number"
      ? Math.max(0, Math.min(100, Math.round(body.score_pct)))
      : 0;

  const supabase = supabaseAdmin();

  // ✅ хадгалалт
  const { error } = await supabase.from("relations_test_results").insert({
    user_id: userId,
    test_slug: body.test_slug,
    test_title: body.test_title,
    score_pct: scorePct,
    band_title: body.band_title ?? null,
    band_summary: body.band_summary ?? null,
    answers: body.answers ?? [],
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
