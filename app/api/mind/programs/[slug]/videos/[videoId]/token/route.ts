import { createHash } from "node:crypto";
import { auth } from "@/app/(auth)/auth";
import { getProgramPurchase, getProgramVideoAsset, getPublishedProgramBySlug } from "@/lib/db/queries";
import { canAccessOrganizationProgram, resolveOrganizationEntitlements } from "@/lib/organizations/access";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; videoId: string }> }) {
  const session = await auth();
  const { slug, videoId } = await params;
  const program = await getPublishedProgramBySlug(slug);
  if (!program || program.renderer !== "BUILDER") return Response.json({ error: "program_not_found" }, { status: 404 });
  if (program.audience === "ORGANIZATION") {
    if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
    const access = await resolveOrganizationEntitlements(session.user.id);
    if (!canAccessOrganizationProgram(access, program.organizationRoles)) return Response.json({ error: "forbidden" }, { status: 403 });
  } else if (program.price > 0) {
    if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
    const purchase = await getProgramPurchase(program.id, session.user.id);
    if (purchase?.status !== "PAID") return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const video = await getProgramVideoAsset(videoId);
  const referenced = program.definition.sections.some((section) => section.video?.videoId === videoId);
  if (!video || video.status !== "READY" || !referenced) return Response.json({ error: "video_not_ready" }, { status: 403 });
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_KEY || process.env.BUNNY_STREAM_API_KEY;
  const embedHost = process.env.BUNNY_STREAM_EMBED_HOST || "iframe.mediadelivery.net";
  if (!libraryId || !tokenKey) return Response.json({ error: "video_not_configured" }, { status: 503 });
  const expires = Math.floor(Date.now() / 1000) + 300;
  const token = createHash("sha256").update(`${tokenKey}${videoId}${expires}`).digest("hex");
  const embedUrl = `https://${embedHost}/embed/${libraryId}/${videoId}?token=${encodeURIComponent(token)}&expires=${expires}`;
  return Response.json({ videoId, token, expires, embedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
