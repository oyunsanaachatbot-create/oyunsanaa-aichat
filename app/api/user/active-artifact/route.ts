import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@supabase/supabase-js";

type Body = { id?: string; title?: string; slug?: string; content?: string };

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 200 });
    }

    const body = (await req.json()) as Body;

    const id = (body.id ?? "").toString();
    const title = (body.title ?? "").toString();

    const slugRaw = body.slug;
    const slug =
      typeof slugRaw === "string" && slugRaw.trim().length > 0 ? slugRaw.trim() : null;

    const content = (body.content ?? "").toString();

    if (!id || !title) {
      return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 200 });
    }

    // ✅ STATIC id ("static-" эсвэл "static_") байвал uuid талбарт хийхгүй
    const isStatic = id.startsWith("static-") || id.startsWith("static_");
    const activeArtifactId = isStatic ? null : id;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, reason: "missing_env" }, { status: 200 });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          active_artifact_id: activeArtifactId, // ✅ энд л өөрчлөгдөж байгаа
          active_artifact_title: title,
          active_artifact_slug: slug,
          active_artifact_content: content || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      return NextResponse.json(
        { ok: false, reason: "db_error", detail: error.message },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: "server_error", detail: e?.message ?? "unknown" },
      { status: 200 },
    );
  }
}
