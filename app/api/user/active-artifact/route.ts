import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  const { id, title } = await req.json();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "__Secure-next-auth.session-token", // 🔑 production cookie
  });

  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  const email = (token as any).email;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: user, error: userErr } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .single();

  if (!user || userErr) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("User")
    .update({
      active_artifact_id: id,
      active_artifact_title: title,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
