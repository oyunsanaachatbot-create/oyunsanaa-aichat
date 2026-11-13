import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    // Derive the user from the session — never trust a client-supplied userId (IDOR guard).
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { answers } = await req.json();

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("goal_inputs")
      .insert([{ user_id: userId, flow: "purpose_goal", answers }])
      .select("id, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, inputId: data.id, createdAt: data.created_at });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
