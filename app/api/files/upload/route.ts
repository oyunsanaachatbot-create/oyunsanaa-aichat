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

  return NextResponse.json({
    url: data.publicUrl,
    name,
    contentType: file.type,
  });
}
