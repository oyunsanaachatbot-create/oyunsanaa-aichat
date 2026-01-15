export function templateKey(sectionId) {
  return `oyun_ebook_template_${sectionId}_v1`;
}
export function notesKey(sectionId) {
  return `oyun_ebook_notes_${sectionId}_v1`;
}

export function safeJsonParse(s, fallback) {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadTemplate(sectionId, fallback = "paper-white") {
  if (typeof window === "undefined") return fallback;
  const t = window.localStorage.getItem(templateKey(sectionId));
  return t || fallback;
}

export function saveTemplate(sectionId, templateId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(templateKey(sectionId), templateId);
}

export function loadNotes(sectionId) {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(notesKey(sectionId));
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveNotes(sectionId, notes) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(notesKey(sectionId), JSON.stringify(notes || []));
}
