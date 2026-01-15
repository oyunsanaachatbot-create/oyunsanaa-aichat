"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";

import EditorView from "./EditorView";
import PreviewView from "./PreviewView";
import ArchiveView from "./ArchiveView";
import { loadNotes, loadTemplate, saveNotes, saveTemplate } from "./storage";

const SECTION_LABELS = {
  world: "Миний ертөнц",
  memories: "Амьдралын дурсамж",
  notes: "Тэмдэглэл",
  happy: "Талархал · Баярт мөч",
  letters: "Захидал",
  difficult: "Хүнд үе",
  wisdom: "Ухаарал · Сургамж",
  complaints: "Гомдол ба харуусал",
  creatives: "Миний уран бүтээл",
  personals: "Миний булан",
};

function formatDateLabel(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${d} ${hh}:${mm}`;
}
function nowLabel() {
  return formatDateLabel(new Date());
}

export default function EbookWritePage({ params }) {
  const sectionId = params?.id || "world";
  const sectionTitle = SECTION_LABELS[sectionId] || "Миний ном";

  // ✅ BRAND (шар өнгө байхгүй)
  const BRAND = "#1F6FB2";
  const BRAND_SOFT_BG = "rgba(31,111,178,0.08)";
  const BRAND_SOFT_BORDER = "rgba(31,111,178,0.30)";

  const [templateId, setTemplateId] = useState("paper-white");
  const [includeInBook, setIncludeInBook] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageAspect, setImageAspect] = useState("landscape");

  const [savedNotes, setSavedNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [q, setQ] = useState("");

  // ✅ Preview “дагах” дохио (typing үед scroll тогтвортой болгоно)
  const [typingTick, setTypingTick] = useState(0);
  const pingTyping = useCallback(() => {
    setTypingTick((t) => (t + 1) % 1000000);
  }, []);

  // Load once per section
  useEffect(() => {
    setTemplateId(loadTemplate(sectionId, "paper-white"));
    setSavedNotes(loadNotes(sectionId));
  }, [sectionId]);

  // Persist notes
  useEffect(() => {
    saveNotes(sectionId, savedNotes);
  }, [savedNotes, sectionId]);

  // Persist template
  useEffect(() => {
    saveTemplate(sectionId, templateId);
  }, [templateId, sectionId]);

  const resetDraft = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setImageCaption("");
    setImageAspect("landscape");
    setIncludeInBook(true);
    pingTyping();
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !imageUrl) return;

    const now = new Date();
    const base = {
      title: title.trim() || "(гарчиггүй)",
      content: content || "",
      includeInBook,
      templateId,
      imageUrl: imageUrl || "",
      imageCaption: imageCaption || "",
      imageAspect: imageUrl ? imageAspect : "",
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
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title === "(гарчиггүй)" ? "" : note.title);
    setContent(note.content || "");
    setIncludeInBook(!!note.includeInBook);
    setTemplateId(note.templateId || "paper-white");
    setImageUrl(note.imageUrl || "");
    setImageCaption(note.imageCaption || "");
    setImageAspect(note.imageAspect || "landscape");
    pingTyping();

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!confirm("Энэ бичвэрийг бүр мөсөн устгах уу?")) return;
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) resetDraft();
    pingTyping();
  };

  const handleToggleInclude = (id) => {
    setSavedNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, includeInBook: !n.includeInBook } : n
      )
    );
    pingTyping();
  };

  // ✅ Bulk delete (ArchiveView checkbox-оос дуудагдана)
  const handleDeleteMany = (ids) => {
    const idSet = new Set(ids);
    setSavedNotes((prev) => prev.filter((n) => !idSet.has(n.id)));
    if (editingId && idSet.has(editingId)) resetDraft();
    pingTyping();
  };

  const handleDeleteAll = () => {
    if (!confirm("Бүх файлыг бүр мөсөн устгах уу?")) return;
    setSavedNotes([]);
    resetDraft();
    pingTyping();
  };

  const filteredNotes = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return savedNotes;
    return savedNotes.filter((n) => {
      const hay = `${n.title || ""} ${n.dateLabel || ""} ${n.createdAt || ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [savedNotes, q]);

  // Preview notes: includeInBook + draft at end
  const previewNotes = useMemo(() => {
    const book = (savedNotes || [])
      .filter((n) => n.includeInBook)
      .slice()
      .reverse(); // хуучин→шинэ

    const draftHas =
      title.trim() || content.trim() || imageUrl || imageCaption.trim();
    if (!draftHas) return book;

    return [
      ...book,
      {
        id: "draft",
        title: title.trim() || "(гарчиггүй)",
        content: content || "",
        imageUrl: imageUrl || "",
        imageCaption: imageCaption || "",
        imageAspect: imageUrl ? imageAspect : "",
        dateLabel: nowLabel(),
        isDraft: true,
      },
    ];
  }, [savedNotes, title, content, imageUrl, imageCaption, imageAspect]);

  const A4_WRAPPER =
    "rounded-[26px] shadow-[0_18px_45px_rgba(0,0,0,0.16)] border overflow-hidden px-6 py-5 flex flex-col " +
    "w-full max-w-[520px] aspect-[210/297] h-auto " +
    "lg:w-[520px] lg:h-[740px] lg:aspect-auto";

  return (
    <div className="min-h-screen" style={{ background: "#f3f6fb" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TOP BUTTONS (Brand) */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link href="/">
            <button
              className="rounded-full border text-xs px-4 py-1.5 shadow-sm hover:bg-white"
              style={{
                borderColor: BRAND_SOFT_BORDER,
                backgroundColor: "rgba(255,255,255,0.88)",
                color: BRAND,
              }}
            >
              ← Чат руу буцах
            </button>
          </Link>

          <Link href="/mind/ebooks">
            <button
              className="rounded-full border text-xs px-4 py-1.5 shadow-sm hover:bg-white"
              style={{
                borderColor: BRAND_SOFT_BORDER,
                backgroundColor: "rgba(255,255,255,0.88)",
                color: BRAND,
              }}
            >
              ← E-book руу буцах
            </button>
          </Link>

          <Link href={`/mind/ebooks/${sectionId}/templates`}>
            <button
              className="rounded-full border text-xs px-4 py-1.5 shadow-sm hover:bg-white"
              style={{
                borderColor: BRAND_SOFT_BORDER,
                backgroundColor: BRAND_SOFT_BG,
                color: BRAND,
              }}
            >
              Загвар сонгох
            </button>
          </Link>

          <Link href="/mind/ebooks/preview">
            <button
              className="rounded-full border text-xs px-4 py-1.5 shadow-[0_10px_26px_rgba(0,0,0,0.14)] hover:opacity-95"
              style={{
                borderColor: BRAND,
                backgroundColor: BRAND,
                color: "white",
              }}
            >
              Эх бэлтгэл
            </button>
          </Link>

          <span
            className="ml-auto text-[11px] tracking-[0.25em] uppercase"
            style={{ color: BRAND }}
          >
            {sectionTitle}
          </span>
        </div>

        {/* 2 COL */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <EditorView
            A4_WRAPPER={A4_WRAPPER}
            sectionId={sectionId}
            sectionTitle={sectionTitle}
            templateId={templateId}
            includeInBook={includeInBook}
            setIncludeInBook={setIncludeInBook}
            title={title}
            setTitle={(v) => { setTitle(v); pingTyping(); }}
            content={content}
            setContent={(v) => { setContent(v); pingTyping(); }}
            imageUrl={imageUrl}
            setImageUrl={(v) => { setImageUrl(v); pingTyping(); }}
            imageCaption={imageCaption}
            setImageCaption={(v) => { setImageCaption(v); pingTyping(); }}
            imageAspect={imageAspect}
            setImageAspect={(v) => { setImageAspect(v); pingTyping(); }}
            editingId={editingId}
            onSave={handleSave}
          />

          <PreviewView
            A4_WRAPPER={A4_WRAPPER}
            sectionTitle={sectionTitle}
            templateId={templateId}
            previewNotes={previewNotes}
            typingTick={typingTick}
            brandColor={BRAND}
          />
        </div>

        {/* ARCHIVE */}
        <ArchiveView
          brandColor={BRAND}
          softBorder={BRAND_SOFT_BORDER}
          savedNotes={savedNotes}
          q={q}
          setQ={setQ}
          filteredNotes={filteredNotes}
          onEdit={handleEdit}
          onToggleInclude={handleToggleInclude}
          onDelete={handleDelete}
          onDeleteMany={handleDeleteMany}
          onDeleteAll={handleDeleteAll}
        />

        <div className="mt-4 text-[11px] text-black/45 lg:hidden">
          Гар утсан дээр зүүн/баруун нь доошоо дарааллаад харагдана.
        </div>
      </div>
    </div>
  );
}
