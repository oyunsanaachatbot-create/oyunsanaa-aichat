// app/(chat)/api/balance/run/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // ✅ env ашиглана
export const dynamic = "force-dynamic"; // ✅ build дээр pre-eval хийхээс сэргийлнэ

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export async function POST(req: Request) {
  try {
    // ✅ хоёр нэрээр fallback хийж өглөө (аль нь байгаагаа ашиглана)
    const supabaseUrl =
      getEnv("SUPABASE_URL") ?? getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey =
      getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_KEY");

    if (!supabaseUrl) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_URL missing on server" },
        { status: 500 }
      );
    }
    if (!serviceKey) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { userId, result } = body ?? {};

    if (!userId || !result) {
      return NextResponse.json(
        { ok: false, error: "userId/result required" },
        { status: 400 }
      );
    }

    // ⬇️ энд таны хадгалах хүснэгтээ нэрлэнэ (түр placeholder)
    // жишээ: balance_runs
    const { error } = await supabase.from("balance_runs").insert({
      user_id: userId,
      result,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
