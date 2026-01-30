import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";

export const maxDuration = 60;

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((f) => f.size <= 5 * 1024 * 1024, { message: "Max 5MB" })
    .refine((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type), {
      message: "Only JPG/PNG/WEBP",
    }),
});

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env");
  return createClient(url, key, { auth: { persistSession: false } });
}

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

  const supabase = getSupabaseAdmin();
  const bucket = "chat-uploads";
  const ext = safeExt(file.type);
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${name}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  // ✅ хамгийн чухал: UI зураг танихын тулд contentType заавал буцаа
  return NextResponse.json({
    url: data.publicUrl,
    name,
    contentType: file.type,
  });
}
