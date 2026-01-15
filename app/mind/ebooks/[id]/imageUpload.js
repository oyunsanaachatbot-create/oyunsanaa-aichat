"use client";

import { supabase } from "@/lib/supabaseClient";

const BUCKET = "ebook-images";

function extFromFile(file) {
  const n = (file?.name || "").toLowerCase();
  const m = n.match(/\.(jpg|jpeg|png|webp|gif)$/);
  return m ? m[1] : "jpg";
}

export async function uploadEbookImage({ sectionId, file }) {
  if (!supabase) throw new Error("Supabase client not configured");
  if (!file) throw new Error("No file");

  const ext = extFromFile(file);
  const safeSection = String(sectionId || "world").replace(/[^a-z0-9_-]/gi, "_");
  const path = `${safeSection}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error("Failed to get public URL");

  return publicUrl;
}
