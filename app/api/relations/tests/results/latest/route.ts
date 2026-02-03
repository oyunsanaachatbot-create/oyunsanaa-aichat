import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const testSlug = url.searchParams.get("test_slug"); // optional

  const supabase = supabaseAdmin();

  let q = supabase
    .from("relations_test_results")
    .select(
      "id, user_id, test_slug, test_title, score_pct, band_title, band_summary, answers, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (testSlug) q = q.eq("test_slug", testSlug);

  const { data, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Query failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data?.[0] ?? null });
}
