import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";

type Body = { id?: string; title?: string; slug?: string; content?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
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

  const isStatic = rawId.startsWith("static-") || rawId.startsWith("static_");
  const activeArtifactId = isStatic ? null : (UUID_RE.test(rawId) ? rawId : null);
  const slug = slugRaw.length > 0 ? slugRaw : null;
  const safeContent = content.trim().length > 0 ? content : null;

  const db = getPgAdmin();

  const { error } = await db
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
    console.error("active-artifact: db_error", { userId, rawId, activeArtifactId, title, slug, message: error.message });
    return NextResponse.json(
      { ok: false, reason: "db_error", message: error.message },
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
