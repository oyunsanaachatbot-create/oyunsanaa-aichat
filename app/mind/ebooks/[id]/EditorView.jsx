"use client";

import { useRef, useState } from "react";
import { uploadEbookImage } from "./imageUpload";

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
    <div className="rounded-2xl overflow-hidden border border-[#ecd7c5] bg-white/50">
      <div className={`${hClass} flex items-center justify-center`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          draggable={false}
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
      alert("Зураг upload хийхэд алдаа гарлаа. Bucket нэр/permission-оо шалгаарай.");
    } finally {
      setUploading(false);
      // адилхан файл дахин сонгоход ажиллуулах
      e.target.value = "";
    }
  };

  return (
    <div className="flex justify-center">
     <div className={`${A4_WRAPPER} border border-black/10 bg-white`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-[11px] text-[#a17655]">
            Одоогийн загвар: <span className="font-semibold">{templateId}</span>
          </div>

          <label className="flex items-center gap-1.5 text-[10px] text-[#7a5a42]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[rgba(31,111,178,0.45)] accent-[#1F6FB2]"
              checked={includeInBook}
              onChange={(e) => setIncludeInBook(e.target.checked)}
            />
            Номонд оруулах
          </label>
        </div>

        {/* title */}
        <div className="mb-2">
          <label className="block text-[10px] text-[#8d6b51] mb-1">Гарчиг</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Гарчиг бичих..."
            className="w-full rounded-xl border border-[#ecd7c5] bg-white/90 text-[12px] px-3 py-2 outline-none focus:ring-2 focus:ring-[rgba(31,111,178,0.35)] focus:border-transparent"
          />
        </div>

        {/* image + caption */}
        {imageUrl ? (
          <div className="mb-3">
            <ImageFrame src={imageUrl} alt="A4 зураг" aspect={imageAspect} />

            <input
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Зургийн доорх тайлбар..."
              className="mt-2 w-full rounded-xl border border-[#ecd7c5] bg-white/90 text-[12px] px-3 py-2 outline-none focus:ring-2 focus:ring-[rgba(31,111,178,0.35)] focus:border-transparent"
            />

            <button
              type="button"
              onClick={() => {
                setImageUrl("");
                setImageCaption("");
                setImageAspect("landscape");
              }}
              className="mt-2 text-[11px] underline"
              style={{ color: BRAND }}
            >
              Зураг авах
            </button>
          </div>
        ) : null}

        {/* text */}
        <div className="flex-1 mb-3 flex flex-col min-h-0">
          <label className="block text-[10px] text-[#8d6b51] mb-1">Бичвэр</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Энд өөрийн бодол санаа, дурсамжаа чөлөөтэй бичнэ үү..."
            className="w-full flex-1 rounded-2xl border border-[#ecd7c5] bg-white/90 text-[12px] px-3 py-2 outline-none resize-none leading-[1.7] focus:ring-2 focus:ring-[rgba(31,111,178,0.35)] focus:border-transparent"
          />
        </div>

        {/* actions */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImageButtonClick}
              disabled={uploading}
              className="rounded-full border border-[#d0b09a] bg-white text-[11px] px-3 py-1.5 text-[#7c5a3e] hover:bg-[#fff7f0] disabled:opacity-60"
            >
              {uploading ? "Зураг upload..." : "Зураг оруулах"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <button
            type="button"
            onClick={onSave}
            className="rounded-full text-white text-[11px] px-4 py-1.5 shadow-[0_10px_26px_rgba(0,0,0,0.18)] hover:opacity-95"
            style={{ backgroundColor: BRAND }}
          >
            {editingId ? "Засвар хадгалах" : "Хадгалах"}
          </button>
        </div>

        <div className="mt-auto pt-2 text-[10px] text-[#c0a491] flex justify-between">
          <span>Бичих хуудас</span>
          <span>{sectionTitle}</span>
        </div>
      </div>
    </div>
  );
}
