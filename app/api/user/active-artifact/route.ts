import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  const { slug, title } = await req.json();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token as any)?.id || (token as any)?.sub;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("User")
    .update({
      active_artifact_slug: slug,     // ✅ шинэ field
      active_artifact_title: title,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
