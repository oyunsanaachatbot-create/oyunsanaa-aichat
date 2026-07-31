"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";

import { AppShell, Button } from "@/components/mind/app-shell";
import EditorView from "./EditorView";
import PreviewView from "./PreviewView";
import ArchiveView from "./ArchiveView";
import { loadNotes, loadTemplate, saveNotes, saveTemplate } from "./storage";
import { useT } from "@/lib/i18n/provider";

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
  const { id } = use(params);
  const sectionId = id || "world";
  const t = useT();
  const w = t.apps.ebooks.write;
  const sectionTitle =
    t.apps.ebooks.sections[sectionId]?.title || t.apps.ebooks.defaultBookTitle;

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
  const [, setTypingTick] = useState(0);
  const pingTyping = useCallback(() => {
    setTypingTick((tick) => (tick + 1) % 1_000_000);
  }, []);

  // Load once per section
  useEffect(() => {
    setTemplateId(loadTemplate(sectionId, "paper-white"));
    setSavedNotes(loadNotes(sectionId));
  }, [sectionId]);

  useEffect(() => {
    const editParam =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("edit");
    if (!editParam || editingId || savedNotes.length === 0) return;
    const note = savedNotes.find((item) => String(item.id) === editParam);
    if (!note) return;
    setEditingId(note.id);
    setTitle(note.title === "(гарчиггүй)" ? "" : note.title);
    setContent(note.content || "");
    setIncludeInBook(!!note.includeInBook);
    setTemplateId(note.templateId || "paper-white");
    setImageUrl(note.imageUrl || "");
    setImageCaption(note.imageCaption || "");
    setImageAspect(note.imageAspect || "landscape");
    pingTyping();
  }, [editingId, savedNotes, pingTyping]);

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

  const handleDelete = (noteId) => {
    if (!confirm(w.deleteConfirm)) return;
    setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (editingId === noteId) resetDraft();
    pingTyping();
  };

  const handleToggleInclude = (noteId) => {
    setSavedNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, includeInBook: !n.includeInBook } : n
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
    if (!confirm(w.deleteAllConfirm)) return;
    setSavedNotes([]);
    resetDraft();
    pingTyping();
  };

  const filteredNotes = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return savedNotes;
    return savedNotes.filter((n) => {
      const hay =
        `${n.title || ""} ${n.dateLabel || ""} ${n.createdAt || ""}`.toLowerCase();
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

  // Simulated A4 book page — aspect-locked, matches the exported book look.
  const A4_WRAPPER =
    "rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] overflow-hidden px-6 py-5 flex flex-col " +
    "w-full max-w-[520px] aspect-[210/297] h-auto " +
    "lg:w-[520px] lg:h-[740px] lg:aspect-auto";

  // The editor is a form, not a book page — plain app card, no aspect lock.
  const EDITOR_WRAPPER =
    "rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] px-6 py-5 flex flex-col " +
    "w-full max-w-[680px] min-h-[740px] " +
    "lg:w-[680px]";

  return (
    <AppShell
      actions={
        <Button
          className="hidden sm:inline-flex"
          href="/mind/ebooks/preview"
          variant="ghost"
        >
          {w.preview}
        </Button>
      }
      backHref="/mind/ebooks"
      subtitle={w.writingPage}
      title={sectionTitle}
      width="full"
    >
      <div className="mx-auto max-w-7xl space-y-6 font-sans">
        {/* 2 COL */}
        <div className="grid items-start justify-center gap-5 lg:grid-cols-[minmax(0,680px)_minmax(0,520px)] lg:gap-6">
          <EditorView
            A4_WRAPPER={EDITOR_WRAPPER}
            content={content}
            editingId={editingId}
            imageAspect={imageAspect}
            imageCaption={imageCaption}
            imageUrl={imageUrl}
            includeInBook={includeInBook}
            onSave={handleSave}
            sectionId={sectionId}
            sectionTitle={sectionTitle}
            setContent={(v) => {
              setContent(v);
              pingTyping();
            }}
            setImageAspect={(v) => {
              setImageAspect(v);
              pingTyping();
            }}
            setImageCaption={(v) => {
              setImageCaption(v);
              pingTyping();
            }}
            setImageUrl={(v) => {
              setImageUrl(v);
              pingTyping();
            }}
            setIncludeInBook={setIncludeInBook}
            setTitle={(v) => {
              setTitle(v);
              pingTyping();
            }}
            templateId={templateId}
            title={title}
          />

          <PreviewView
            A4_WRAPPER={A4_WRAPPER}
            previewNotes={previewNotes}
            sectionTitle={sectionTitle}
            templateId={templateId}
          />
        </div>

        {/* ARCHIVE */}
        <ArchiveView
          filteredNotes={filteredNotes}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          onDeleteMany={handleDeleteMany}
          onEdit={handleEdit}
          onToggleInclude={handleToggleInclude}
          q={q}
          savedNotes={savedNotes}
          setQ={setQ}
        />

        <div className="text-[11px] text-black/45 lg:hidden">
          {w.mobileHint}
        </div>
      </div>
    </AppShell>
  );
}
