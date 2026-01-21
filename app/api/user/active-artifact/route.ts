import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@app/(auth)/auth"; // ✅ чиний auth.ts яг энэ экспорттой

export async function POST(req: Request) {
  try {
    const { id, title } = await req.json();

    const session = await auth();
    const userId = session?.user?.id;

    // DEBUG (түр): Vercel logs дээр харахад хэрэгтэй
    console.log("ACTIVE_ARTIFACT session:", session?.user);

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("User")
      .update({
        active_artifact_id: id ?? null,
        active_artifact_title: title ?? null,
      })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}
