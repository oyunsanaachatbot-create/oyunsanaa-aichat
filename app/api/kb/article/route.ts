import { NextResponse } from "next/server";
import { getPgAdmin } from "@/lib/db/pgClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";

  if (!slug) return NextResponse.json({ ok: false, reason: "missing_slug" }, { status: 400 });

  const db = getPgAdmin();

  const { data, error } = await db
    .from("kb_articles")
    .select("slug,title,content,category,updated_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, reason: "not_found", detail: error?.message }, { status: 404 });
  }

  return NextResponse.json({ ok: true, article: data }, { status: 200 });
}
