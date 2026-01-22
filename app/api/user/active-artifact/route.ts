import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@supabase/supabase-js";

type Body = { id?: string; title?: string; slug?: string };

export async function POST(req: Request) {
  try {
    // 1) session
    const session = await auth();
    const userId = session?.user?.id;

    // login хийгээгүй үед crash хийхгүй, зүгээр OK буцаана
    if (!userId) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 200 });
    }

    // 2) body
    const body = (await req.json()) as Body;
    const id = (body.id ?? "").toString();
    const title = (body.title ?? "").toString();
    const slug = (body.slug ?? "").toString();

    if (!id || !title) {
      return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 200 });
    }

    // 3) Supabase (server)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY; // аль нь байгааг нь ашиглая

    if (!url || !serviceKey) {
      // env байхгүй бол 500 биш 200 буцаагаад UI-г эвдэхгүй
      return NextResponse.json({ ok: false, reason: "missing_env" }, { status: 200 });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // ✅ 4) хадгалах хүснэгт (доорх SQL-ийг яг 1 удаа хий)
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          active_artifact_id: id,
          active_artifact_title: title,
          active_artifact_slug: slug,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      // 500 болгохгүй, 200 буцаагаад шалтгааныг текстээр өгнө
      return NextResponse.json({ ok: false, reason: "db_error", detail: error.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    // ямар ч crash байсан 200 буцаана (чи одоо “evdersen” гэж мэдрээд байгаа тул)
    return NextResponse.json(
      { ok: false, reason: "server_error", detail: e?.message ?? "unknown" },
      { status: 200 },
    );
  }
}
