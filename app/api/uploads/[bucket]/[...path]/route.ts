// app/api/uploads/[bucket]/[...path]/route.ts
//
// Serves files previously written via StorageBucket.upload() (lib/db/pgClient.ts),
// which stores bytes in the shared `blob_storage` Postgres table rather than the
// local filesystem. Public by design — these URLs are the same ones sent to the
// chat model and rendered as <img src> in the client, exactly like the old
// public/uploads/* static files were.
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/pgClient";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const { bucket, path } = await params;
  const filePath = path.join("/");

  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 500 }
    );
  }

  const rows = await sql`
    SELECT content_type, data FROM blob_storage
    WHERE bucket = ${bucket} AND path = ${filePath}
    LIMIT 1
  `;

  const row = rows[0] as
    | { content_type: string | null; data: Buffer }
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.content_type ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
