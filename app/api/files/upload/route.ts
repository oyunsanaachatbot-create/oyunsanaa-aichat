import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";

export const maxDuration = 60;

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((f) => f.size <= 5 * 1024 * 1024, { message: "Max 5MB" })
    .refine((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type), {
      message: "Only JPG/PNG/WEBP",
    }),
});

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

  const validated = FileSchema.safeParse({ file });
  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.errors.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const storage = getPgAdmin().storage;
  const bucket = "chat-uploads";
  const ext = safeExt(file.type);
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${name}`;

  const { error: upErr } = await storage.from(bucket).upload(path, file, {
    contentType: file.type,
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
    contentType: file.type,
  });
}
