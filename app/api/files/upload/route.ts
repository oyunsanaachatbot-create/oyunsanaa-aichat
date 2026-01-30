import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/(auth)/auth";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function safeName(name: string) {
  return (name || "upload").replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized (no session)" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase env missing",
          details: {
            hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
            hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          },
        },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file in form-data (expected key 'file')" },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_UPLOAD_BUCKET || "chat-uploads";
    const contentType = file.type || "application/octet-stream";
    const original = safeName(file.name);
    const key = `${userId}/${Date.now()}_${crypto.randomUUID()}_${original}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(key, bytes, { contentType, upsert: false, cacheControl: "3600" });

    if (uploadError) {
      return NextResponse.json(
        {
          error: "Supabase storage upload failed",
          details: {
            bucket,
            message: uploadError.message,
          },
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    const url = data?.publicUrl;

    if (!url) {
      return NextResponse.json(
        {
          error: "Could not create public URL",
          details: { bucket, key },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url, pathname: key, contentType });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Unexpected upload error",
        details: {
          message: err?.message ?? String(err),
          name: err?.name,
        },
      },
      { status: 500 }
    );
  }
}
