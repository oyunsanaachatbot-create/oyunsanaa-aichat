import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

export const runtime = "nodejs"; // formData + buffer дээр safe
export const maxDuration = 60;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server дээр л ашиглана
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function safeExt(filename: string) {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

function safeBaseName(filename: string) {
  return filename.replace(/[^\w.\-]+/g, "_").slice(0, 80);
}

export async function POST(req: Request) {
  try {
    // 1) Auth (NextAuth identity)
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Supabase admin
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 }
      );
    }

    // 3) Read multipart form
    const form = await req.formData();

    // SDK template-үүд өөр өөр key ашигладаг тул хэд хэдэн нэрээр шүүнэ
    const file =
      (form.get("file") as File | null) ||
      (form.get("files") as File | null) ||
      (form.get("image") as File | null) ||
      (form.get("attachment") as File | null);

    if (!file) {
      return NextResponse.json({ error: "No file in form-data (expected 'file')" }, { status: 400 });
    }

    // 4) Basic validation
    const contentType = file.type || "application/octet-stream";
    const size = file.size ?? 0;

    // 10MB limit (хүсвэл өөрчилж болно)
    if (size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    // 5) Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // 6) Upload path (user scoped)
    const bucket = process.env.SUPABASE_UPLOAD_BUCKET || "chat-uploads";
    const originalName = file.name || "upload";
    const ext = safeExt(originalName);
    const base = safeBaseName(originalName.replace(ext, ""));
    const key = `${userId}/${Date.now()}_${crypto.randomUUID()}_${base}${ext}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(key, bytes, {
        contentType,
        upsert: false,
        cacheControl: "3600",
      });

    if (upErr) {
      return NextResponse.json(
        { error: "Upload failed", details: upErr.message },
        { status: 500 }
      );
    }

    // 7) Public URL (bucket public байх хэрэгтэй)
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
    const url = pub?.publicUrl;

    if (!url) {
      return NextResponse.json(
        { error: "Could not build public URL. Make bucket public or use signed URLs." },
        { status: 500 }
      );
    }

    // 8) Return attachment payload (client MultimodalInput ихэвчлэн үүнийг ашигладаг)
    return NextResponse.json({
      url,
      pathname: key,
      contentType,
      name: originalName,
      size,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
