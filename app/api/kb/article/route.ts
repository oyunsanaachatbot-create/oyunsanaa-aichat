import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";

  if (!slug) return NextResponse.json({ ok: false, reason: "missing_slug" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, reason: "missing_env" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("kb_articles")
    .select("slug,title,content,category,updated_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, reason: "not_found", detail: error?.message }, { status: 404 });
  }

  return NextResponse.json({ ok: true, article: data }, { status: 200 });
}
