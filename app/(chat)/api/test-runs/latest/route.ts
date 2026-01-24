import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testSlug = String(searchParams.get("testSlug") ?? "");
    if (!testSlug) {
      return NextResponse.json({ error: "Missing testSlug" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("test_runs")
      .select("answers,result,created_at,total_score100,test_slug")
      .eq("user_id", userId)
      .eq("test_slug", testSlug)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const row = data?.[0];
    if (!row) return NextResponse.json({ item: null });

    // BalanceResultPage чинь Stored {answers,result,at} хэлбэрээр хэрэглэдэг
    const item = {
      answers: row.answers,
      result: row.result,
      at: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    };

    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
