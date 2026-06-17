import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";

export const maxDuration = 60;

const BUCKET = "ebook-images";
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extFromMime(m: string) {
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "jpg";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const sectionId = String(form.get("sectionId") ?? "world");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG/PNG/WEBP/GIF" }, { status: 400 });
  }

  const safeSection = sectionId.replace(/[^a-z0-9_-]/gi, "_");
  const name = `${Date.now()}_${crypto.randomUUID()}.${extFromMime(file.type)}`;
  const path = `${safeSection}/${name}`;

  const storage = getPgAdmin().storage;
  const { error } = await storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
