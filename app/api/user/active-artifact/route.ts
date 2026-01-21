import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth"; // танайд auth() байвал (ихэнх next-auth app router дээр байдаг)

export async function POST(req: Request) {
  const { id, title } = await req.json();

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // сервер дээр л ашиглана
  );

  const { error } = await supabase
    .from("User")
    .update({
      active_artifact_id: id,
      active_artifact_title: title,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
