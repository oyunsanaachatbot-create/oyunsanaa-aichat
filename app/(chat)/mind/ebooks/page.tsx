"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  APP_SHELL_TOKENS,
  AppShell,
  Button,
  EmptyState,
  Field,
  Muted,
  SectionHeading,
  TextArea,
  TextInput,
} from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";
import { uploadEbookImage } from "./[id]/imageUpload";
import { loadNotes, saveNotes } from "./[id]/storage";

// ✅ SECTION ids нь [id]/page.jsx-ийн SECTION_ORDER-той 1:1 таарах ёстой
const SECTION_ORDER = [
  "world",
  "memories",
  "notes",
  "happy",
  "letters",
  "difficult",
  "wisdom",
  "complaints",
  "creatives",
  "personals",
] as const;

const { BRAND, LINE, INK, MUTED } = APP_SHELL_TOKENS;

function formatDateLabel(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${d} ${hh}:${mm}`;
}

// ✅ Хуучин "Номын агуулга" карт-грид тайлбар/бүтэц устгаагүй, git түүхэнд бий —
// одоо шууд бичих хэсэг рүү орно (доор), апп-ын нийтлэг AppShell дизайнд нийцүүлж.

export default function EbookHome() {
  const t = useT();
  const eb = t.apps.ebooks;
  const w = eb.write;
  const a = eb.archive;

  const [sectionId, setSectionId] =
    useState<(typeof SECTION_ORDER)[number]>("world");
  const [includeInBook, setIncludeInBook] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const sectionTitle =
    (eb.sections as Record<string, { title: string }>)[sectionId]?.title ??
    eb.defaultBookTitle;

  // Ангилал солигдох бүрт тухайн ангиллын хадгалсан бичвэрийг ачаална, ноорог цэвэрлэнэ.
  useEffect(() => {
    setSavedNotes(loadNotes(sectionId));
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setIncludeInBook(true);
    setSaved(false);
  }, [sectionId]);

  useEffect(() => {
    saveNotes(sectionId, savedNotes);
  }, [savedNotes, sectionId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadEbookImage({ sectionId, file });
      setImageUrl(url);
    } catch {
      alert(w.imageUploadError);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const resetDraft = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setIncludeInBook(true);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !imageUrl) return;

    const now = new Date();
    const base = {
      title: title.trim() || eb.untitled,
      content: content || "",
      includeInBook,
      templateId: "paper-white",
      imageUrl: imageUrl || "",
    };

    setSavedNotes((prev) => {
      if (editingId) {
        return prev.map((n) => (n.id === editingId ? { ...n, ...base } : n));
      }
      return [
        {
          id: Date.now(),
          ...base,
          createdAt: now.toISOString(),
          dateLabel: formatDateLabel(now),
        },
        ...prev,
      ];
    });

    resetDraft();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setTitle(note.title === eb.untitled ? "" : note.title);
    setContent(note.content || "");
    setIncludeInBook(!!note.includeInBook);
    setImageUrl(note.imageUrl || "");
    setSaved(false);
  };

  const handleDelete = (id: any) => {
    if (!confirm(w.deleteConfirm)) return;
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) resetDraft();
  };

  return (
    <AppShell
      actions={
        <Button
          className="hidden sm:inline-flex"
          href="/mind/ebooks/extras"
          variant="ghost"
        >
          {eb.sections.extras.title}
        </Button>
      }
      subtitle={eb.subtitle}
      title={eb.title}
      width="4xl"
    >
      <div className="space-y-5">
        <Field htmlFor="ebook-category" label={w.categoryLabel}>
          <select
            className="w-full rounded-[14px] border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15"
            id="ebook-category"
            onChange={(e) =>
              setSectionId(e.target.value as (typeof SECTION_ORDER)[number])
            }
            style={{ borderColor: LINE, color: INK }}
            value={sectionId}
          >
            {SECTION_ORDER.map((sid, index) => (
              <option key={sid} value={sid}>
                {index + 1}. {(eb.sections as Record<string, { title: string }>)[sid]
                  ?.title ?? sid}
              </option>
            ))}
          </select>
        </Field>

        <Field htmlFor="ebook-title" label={w.titleLabel}>
          <TextInput
            id="ebook-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder={w.titlePlaceholder}
            value={title}
          />
        </Field>

        <Field htmlFor="ebook-content" label={w.contentLabel}>
          <TextArea
            className="min-h-[320px]"
            id="ebook-content"
            onChange={(e) => setContent(e.target.value)}
            placeholder={w.contentPlaceholder}
            rows={14}
            value={content}
          />
        </Field>

        {imageUrl && (
          <div className="space-y-2">
            {/* biome-ignore lint/performance/noImgElement: user-uploaded remote URL, not a static asset */}
            {/* biome-ignore lint/nursery/useImageSize: variable-size user upload, sized responsively via CSS */}
            <img
              alt=""
              className="max-h-64 w-full rounded-[14px] border object-cover"
              src={imageUrl}
              style={{ borderColor: LINE }}
            />
            <button
              className="text-sm underline"
              onClick={() => setImageUrl("")}
              style={{ color: BRAND }}
              type="button"
            >
              {w.removeImage}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            className="flex items-center gap-2 text-sm"
            style={{ color: INK }}
          >
            <input
              checked={includeInBook}
              className="size-4 rounded accent-[#1F6FB2]"
              onChange={(e) => setIncludeInBook(e.target.checked)}
              type="checkbox"
            />
            {w.includeInBook}
          </label>

          <div className="flex items-center gap-2">
            <input
              accept="image/*"
              className="hidden"
              id="ebook-image-input"
              onChange={handleImageChange}
              type="file"
            />
            <Button
              disabled={uploading}
              onClick={() =>
                document.getElementById("ebook-image-input")?.click()
              }
              type="button"
              variant="ghost"
            >
              <ImagePlus className="size-4" />
              {uploading ? w.uploading : w.addImage}
            </Button>
            <Button onClick={handleSave} type="button">
              {editingId ? w.saveEdit : w.save}
            </Button>
          </div>
        </div>

        {saved && <Muted>✓ {w.savedNotice}</Muted>}
      </div>

      {/* Тухайн ангиллын хадгалсан бичвэрүүд */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading>{sectionTitle}</SectionHeading>
          <Button
            className="text-xs"
            href={`/mind/ebooks/${sectionId}`}
            variant="ghost"
          >
            {w.prepareBook} →
          </Button>
        </div>

        {savedNotes.length === 0 ? (
          <EmptyState>{a.noNotes}</EmptyState>
        ) : (
          <div className="space-y-2">
            {savedNotes.map((n) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3"
                key={n.id}
                style={{ borderColor: LINE }}
              >
                <div className="min-w-0">
                  <div
                    className="truncate font-medium text-sm"
                    style={{ color: INK }}
                  >
                    {n.title}
                  </div>
                  <div className="text-xs" style={{ color: MUTED }}>
                    {n.dateLabel}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    className="font-medium text-xs underline"
                    onClick={() => handleEdit(n)}
                    style={{ color: BRAND }}
                    type="button"
                  >
                    {a.edit}
                  </button>
                  <button
                    aria-label={a.delete}
                    className="text-slate-400 transition-colors hover:text-rose-600"
                    onClick={() => handleDelete(n.id)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
