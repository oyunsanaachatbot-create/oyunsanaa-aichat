import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recordContentUsage } from "@/lib/taxonomy/recommendations";

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
  } = body;

  const supabase = supabaseAdmin();

  const { error } = await supabase.from("relations_test_results").insert({
    user_id: userId,
    test_slug,
    test_title,
    score_pct,
    band_title,
    band_summary,
    answers,
  });

  if (error) {
    console.error("Supabase insert error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (typeof test_slug === "string" && test_slug.length > 0) {
    await recordContentUsage({
      completed: true,
      externalKey: `static:test:${test_slug}`,
      state: "COMPLETED",
      userId,
    }).catch(() => {
      // The saved test result remains authoritative if tracking is unavailable.
    });
  }

  return NextResponse.json({ ok: true });
}
