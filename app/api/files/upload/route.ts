import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";
import { normalizeUploadedImage } from "@/lib/uploads/normalize-image";

export const maxDuration = 60;

function safeExt(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  let normalizedFile: Blob;
  try {
    normalizedFile = await normalizeUploadedImage(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image" },
      { status: 400 }
    );
  }

  const storage = getPgAdmin().storage;
  const bucket = "chat-uploads";
  const ext = safeExt(normalizedFile.type);
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${name}`;

  const { error: upErr } = await storage.from(bucket).upload(path, normalizedFile, {
    contentType: normalizedFile.type,
    upsert: false,
  });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data } = storage.from(bucket).getPublicUrl(path);

  // Build absolute URL so the chat schema (z.string().url()) passes
  // and the AI model can fetch the image in production.
  const origin = (() => {
    const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
    if (authUrl) {
      try { return new URL(authUrl).origin; } catch (_) { /* ignore */ }
    }
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    return `${proto}://${host}`;
  })();

  const absoluteUrl = data.publicUrl.startsWith("http")
    ? data.publicUrl
    : `${origin}${data.publicUrl}`;

  return NextResponse.json({
    url: absoluteUrl,
    name,
    contentType: normalizedFile.type,
  });
}
