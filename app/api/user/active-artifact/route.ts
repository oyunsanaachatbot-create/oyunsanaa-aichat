import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createClient } from "@supabase/supabase-js";

type Body = { id?: string; title?: string; slug?: string; content?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // ❗️Unauthorized бол 401 байх ёстой (200 битгий)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const rawId = (body.id ?? "").toString().trim();
  const title = (body.title ?? "").toString().trim();
  const slugRaw = (body.slug ?? "").toString().trim();
  const content = (body.content ?? "").toString();

  if (!rawId || !title) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields", need: ["id", "title"] },
      { status: 400 }
    );
  }

  // ✅ STATIC бол uuid талбар руу хийхгүй
  const isStatic = rawId.startsWith("static-") || rawId.startsWith("static_");

  // ✅ uuid биш id ирвэл null болгож DB-г унагахгүй
  // (uuid бишийг хүчээр insert хийхэд Postgres DB error өгөөд бүх UI-г унагадаг)
  const activeArtifactId = isStatic ? null : (UUID_RE.test(rawId) ? rawId : null);

  const slug = slugRaw.length > 0 ? slugRaw : null;
  const safeContent = content.trim().length > 0 ? content : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ✅ зөвхөн service_role ашигла

  if (!url || !serviceKey) {
    // ❗️ENV байхгүй бол 500
    console.error("active-artifact: missing env", {
      hasUrl: !!url,
      hasServiceRole: !!serviceKey,
    });
    return NextResponse.json({ ok: false, reason: "missing_env" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // ✅ Upsert (user_id дээр conflict)
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        active_artifact_id: activeArtifactId,
        active_artifact_title: title,
        active_artifact_slug: slug,
        active_artifact_content: safeContent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    // ✅ эндээс яг Postgres алдаа чинь logs дээр тод гарна
    console.error("active-artifact: db_error", {
      userId,
      rawId,
      activeArtifactId,
      title,
      slug,
      message: error.message,
      // supabase error дээр code/details/hint байж магадгүй
      // @ts-expect-error
      code: (error as any).code,
      // @ts-expect-error
      details: (error as any).details,
      // @ts-expect-error
      hint: (error as any).hint,
    });

    return NextResponse.json(
      {
        ok: false,
        reason: "db_error",
        message: error.message,
        // @ts-expect-error
        code: (error as any).code,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      stored: {
        active_artifact_id: activeArtifactId,
        active_artifact_title: title,
        active_artifact_slug: slug,
      },
    },
    { status: 200 }
  );
}
