import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";
import { ownsPrivateUpload } from "@/lib/uploads/access";

export const runtime = "nodejs";
export async function GET(_req: Request, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  const session = await auth();
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const { bucket, path } = await params;
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "Storage unavailable" }, { status: 503, headers });
  let allowed = ownsPrivateUpload(bucket, path, session.user.id);
  if (!allowed && bucket === "ebook-images" && path.every((part) => part && part !== "." && part !== ".." && !/[\\/\0]/.test(part))) {
    const relativeUrl = `/api/uploads/${bucket}/${path.join("/")}`;
    const notes = await sql`SELECT id FROM public."EbookNote" WHERE "userId" = ${session.user.id}::uuid AND regexp_replace("imageUrl", '^https?://[^/]+', '') = ${relativeUrl} LIMIT 1`;
    allowed = notes.length > 0;
  }
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const rows = await sql`SELECT content_type, data FROM blob_storage WHERE bucket = ${bucket} AND path = ${path.join("/")} LIMIT 1`;
  const row = rows[0] as { content_type: string | null; data: Buffer } | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  return new NextResponse(new Uint8Array(row.data), { headers: { ...headers, "Content-Type": row.content_type ?? "application/octet-stream" } });
}
