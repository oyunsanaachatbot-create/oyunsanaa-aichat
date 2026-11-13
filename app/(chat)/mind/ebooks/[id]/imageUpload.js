"use client";

// Browser → API route (the old direct-Supabase storage client was removed).
// Uploads go through /api/ebooks/upload, which stores the file via the local
// PG storage wrapper and returns a public URL.
export async function uploadEbookImage({ sectionId, file }) {
  if (!file) throw new Error("No file");

  const form = new FormData();
  form.append("file", file);
  form.append("sectionId", String(sectionId || "world"));

  const res = await fetch("/api/ebooks/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Upload failed");
  if (!data?.url) throw new Error("Failed to get public URL");

  return data.url;
}
