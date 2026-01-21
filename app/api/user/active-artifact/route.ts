import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  const { id, title } = await req.json();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token as any)?.email as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) User row-г email-аар олно
  const { data: userRow, error: userErr } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 });
  }

  if (!userRow?.id) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // 2) Олдсон UUID id дээр update хийнэ
  const { error: updErr } = await supabase
    .from("User")
    .update({
      active_artifact_id: id,
      active_artifact_title: title ?? null,
    })
    .eq("id", userRow.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
