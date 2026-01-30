import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

export const maxDuration = 60; // OK (runtime export бүү нэм)

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;

  return createClient(url, service, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "oyunsanaa-upload" } },
  });
}

function safeName(name: string) {
  return (name || "upload")
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase env missing (URL or SERVICE_ROLE)" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded (field name must be 'file')" },
        { status: 400 }
      );
    }

    // ✅ bucket нэр (байгаа bucket-тайгаа тааруул)
    const bucket = process.env.SUPABASE_UPLOAD_BUCKET || "chat-uploads";

    const contentType = file.type || "application/octet-stream";
    const filename = safeName(file.name);
    const path = `${userId}/${Date.now()}_${crypto.randomUUID()}_${filename}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      // ✅ 500-ын яг шалтгаан лог дээр харагдана (Vercel logs)
      console.error("SUPABASE_STORAGE_UPLOAD_FAILED", {
        bucket,
        message: uploadError.message,
      });

      return NextResponse.json(
        { error: "Supabase storage upload failed" },
        { status: 500 }
      );
    }

    // ✅ bucket private байсан ч ажиллуулахын тулд signed URL гаргана
    const { data: signed, error: signedErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 цаг

    if (signed?.signedUrl) {
      return NextResponse.json({
        url: signed.signedUrl,
        pathname: path,
        contentType,
      });
    }

    // fallback: public url (bucket public бол энэ ажиллана)
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    if (pub?.publicUrl) {
      return NextResponse.json({
        url: pub.publicUrl,
        pathname: path,
        contentType,
      });
    }

    console.error("SUPABASE_URL_CREATE_FAILED", { bucket, path, signedErr });
    return NextResponse.json(
      { error: "Could not create file URL" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("UPLOAD_ROUTE_EXCEPTION", err);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}
