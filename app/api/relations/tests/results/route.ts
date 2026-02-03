import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@/lib/supabase/server"; // танайд байгаа server client-ээр

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    test_slug,
    test_title,
    score_pct,
    band_title,
    band_summary,
    answers,
  } = body ?? {};

  if (!test_slug || !test_title || typeof score_pct !== "number") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const supabase = createClient();

  const { error } = await supabase.from("relations_test_results").insert({
    user_id: userId,
    test_slug,
    test_title,
    score_pct,
    band_title: band_title ?? null,
    band_summary: band_summary ?? null,
    answers: answers ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
