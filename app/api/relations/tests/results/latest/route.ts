import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();

  const { data, error } = await supabase
    .from("relations_test_results")
    .select("test_slug,test_title,score_pct,band_title,band_summary,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ latest: data?.[0] ?? null });
}
