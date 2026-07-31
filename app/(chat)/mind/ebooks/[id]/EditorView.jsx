"use client";

import { useRef, useState } from "react";
import { uploadEbookImage } from "./imageUpload";
import { useT } from "@/lib/i18n/provider";

function inferAspect(w, h) {
  if (!w || !h) return "landscape";
  const r = w / h;
  if (r < 0.9) return "portrait";
  if (r > 1.1) return "landscape";
  return "square";
}

function ImageFrame({ src, alt, aspect = "landscape" }) {
  const hClass =
    aspect === "portrait"
      ? "h-[260px]"
      : aspect === "square"
        ? "h-[240px]"
        : "h-[220px]";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white/50">
      <div className={`${hClass} flex items-center justify-center`}>
        {/* biome-ignore lint/performance/noImgElement: uploaded image preview */}
        <img
          alt={alt}
          className="h-full w-full object-contain"
          draggable={false}
          height={260}
          src={src}
          width={520}
        />
      </div>
    </div>
  );
}

export default function EditorView({
  A4_WRAPPER,
  sectionTitle,
  sectionId = "world",

  templateId,
  includeInBook,
  setIncludeInBook,

  title,
  setTitle,
  content,
  setContent,

  imageUrl,
  setImageUrl,
  imageCaption,
  setImageCaption,
  imageAspect,
  setImageAspect,

  editingId,
  onSave,
}) {
  // ✅ Brand + paper scheme
  const BRAND = "#1F6FB2";

  const t = useT();
  const w = t.apps.ebooks.write;

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // ✅ шууд Supabase Storage руу upload (base64 биш!)
      const url = await uploadEbookImage({ sectionId, file });

      setImageUrl(url);

      // aspect хэмжих
      const img = new Image();
      img.onload = () => setImageAspect(inferAspect(img.width, img.height));
      img.src = url;
    } catch (err) {
      console.error(err);
      alert(w.imageUploadError);
    } finally {
      setUploading(false);
      // адилхан файл дахин сонгоход ажиллуулах
      e.target.value = "";
    }
  };

  return (
    <div className="flex justify-center">
      <div className={`${A4_WRAPPER} bg-white`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[#64748b] text-xs">
            {w.currentTemplate}{" "}
            <span className="font-semibold">{templateId}</span>
          </div>

          <label className="flex items-center gap-1.5 text-[#475569] text-xs">
            <input
              checked={includeInBook}
              className="h-4 w-4 rounded border-[rgba(31,111,178,0.45)] accent-[#1F6FB2]"
              onChange={(e) => setIncludeInBook(e.target.checked)}
              type="checkbox"
            />
            {w.includeInBook}
          </label>
        </div>

        {/* title */}
        <div className="mb-2">
          <label className="mb-1 block text-[#475569] text-sm" htmlFor="ebook-note-title">
            {w.titleLabel}
          </label>
          <input
            className="w-full rounded-xl border border-[#e2e8f0] bg-white/90 px-3 py-2 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-[rgba(31,111,178,0.35)]"
            id="ebook-note-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder={w.titlePlaceholder}
            value={title}
          />
        </div>

        {/* image + caption */}
        {imageUrl ? (
          <div className="mb-3">
            <ImageFrame alt={w.imageAlt} aspect={imageAspect} src={imageUrl} />

            <input
              className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white/90 px-3 py-2 text-base outline-none focus:border-transparent focus:ring-2 focus:ring-[rgba(31,111,178,0.35)]"
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder={w.captionPlaceholder}
              value={imageCaption}
            />

            <button
              className="mt-2 text-sm underline"
              onClick={() => {
                setImageUrl("");
                setImageCaption("");
                setImageAspect("landscape");
              }}
              style={{ color: BRAND }}
              type="button"
            >
              {w.removeImage}
            </button>
          </div>
        ) : null}

        {/* text */}
        <div className="mb-3 flex min-h-0 flex-1 flex-col">
          <label className="mb-1 block text-[#475569] text-sm" htmlFor="ebook-note-content">
            {w.contentLabel}
          </label>
          <textarea
            className="min-h-[360px] w-full flex-1 resize-y rounded-2xl border border-[#e2e8f0] bg-white/90 px-3 py-2 text-base leading-[1.7] outline-none focus:border-transparent focus:ring-2 focus:ring-[rgba(31,111,178,0.35)] lg:min-h-[470px]"
            id="ebook-note-content"
            onChange={(e) => setContent(e.target.value)}
            placeholder={w.contentPlaceholder}
            value={content}
          />
        </div>

        {/* actions */}
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-[#334155] text-sm hover:bg-[#f8fafc] disabled:opacity-60"
              disabled={uploading}
              onClick={handleImageButtonClick}
              type="button"
            >
              {uploading ? w.uploading : w.addImage}
            </button>

            <input
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
              ref={fileInputRef}
              type="file"
            />
          </div>

          <button
            className="rounded-full px-5 py-2 text-sm text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)] hover:opacity-95"
            onClick={onSave}
            style={{ backgroundColor: BRAND }}
            type="button"
          >
            {editingId ? w.saveEdit : w.save}
          </button>
        </div>

        <div className="mt-auto flex justify-between pt-2 text-[#94a3b8] text-xs">
          <span>{w.writingPage}</span>
          <span>{sectionTitle}</span>
        </div>
      </div>
    </div>
  );
}
