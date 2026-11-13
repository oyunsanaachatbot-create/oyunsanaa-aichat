export function templateKey(sectionId) {
  return `oyun_ebook_template_${sectionId}_v1`;
}
export function notesKey(sectionId) {
  return `oyun_ebook_notes_${sectionId}_v1`;
}
function migrationKey(sectionId) {
  return `oyun_ebook_notes_db_migrated_${sectionId}_v1`;
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

function formatDateLabel(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${d} ${hh}:${mm}`;
}

function normalizeNote(note) {
  const createdAt = note.createdAt || new Date().toISOString();
  return {
    id: String(note.id ?? note.clientId ?? crypto.randomUUID()),
    title: String(note.title || "(гарчиггүй)"),
    content: String(note.content || ""),
    includeInBook: note.includeInBook !== false,
    templateId: String(note.templateId || "paper-white"),
    imageUrl: String(note.imageUrl || ""),
    imageCaption: String(note.imageCaption || ""),
    imageAspect: String(note.imageAspect || ""),
    createdAt,
    updatedAt: note.updatedAt || createdAt,
    dateLabel: note.dateLabel || formatDateLabel(createdAt),
  };
}

function notePayload(note) {
  const normalized = normalizeNote(note);
  return {
    clientId: normalized.id,
    title: normalized.title,
    content: normalized.content,
    includeInBook: normalized.includeInBook,
    templateId: normalized.templateId,
    imageUrl: normalized.imageUrl,
    imageCaption: normalized.imageCaption,
    imageAspect: normalized.imageAspect,
    createdAt: normalized.createdAt,
  };
}

const syncQueues = new Map();

async function replaceDatabaseNotes(sectionId, notes) {
  const response = await fetch("/api/ebook-notes", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sectionId,
      notes: notes.map(notePayload),
    }),
  });
  if (!response.ok) throw new Error("ebook_notes_sync_failed");
  const body = await response.json();
  return Array.isArray(body.notes) ? body.notes.map(normalizeNote) : [];
}

/** Serialize section writes so a slower old request cannot overwrite a newer edit. */
export function syncNotesToDatabase(sectionId, notes) {
  if (typeof window === "undefined") return Promise.resolve([]);
  const normalized = (notes || []).map(normalizeNote);
  saveNotes(sectionId, normalized);

  const previous = syncQueues.get(sectionId) ?? Promise.resolve();
  const next = previous
    .catch(() => null)
    .then(() => replaceDatabaseNotes(sectionId, normalized))
    .then((saved) => {
      window.localStorage.setItem(migrationKey(sectionId), "1");
      return saved;
    })
    .catch((error) => {
      window.localStorage.removeItem(migrationKey(sectionId));
      throw error;
    });

  syncQueues.set(
    sectionId,
    next.catch(() => null)
  );
  return next;
}

function mergeFirstMigration(databaseNotes, localNotes) {
  const merged = new Map(
    databaseNotes.map((note) => [String(note.id), normalizeNote(note)])
  );
  for (const note of localNotes) {
    const normalized = normalizeNote(note);
    merged.set(normalized.id, normalized);
  }
  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export async function loadNotesFromDatabase(sectionId) {
  const localNotes = loadNotes(sectionId).map(normalizeNote);
  try {
    const response = await fetch(
      `/api/ebook-notes?sectionId=${encodeURIComponent(sectionId)}`,
      { credentials: "same-origin" }
    );
    if (!response.ok) throw new Error("ebook_notes_load_failed");
    const body = await response.json();
    const databaseNotes = Array.isArray(body.notes)
      ? body.notes.map(normalizeNote)
      : [];

    if (window.localStorage.getItem(migrationKey(sectionId)) === "1") {
      saveNotes(sectionId, databaseNotes);
      return databaseNotes;
    }

    const merged = mergeFirstMigration(databaseNotes, localNotes);
    await syncNotesToDatabase(sectionId, merged);
    return merged;
  } catch {
    return localNotes;
  }
}

export async function loadAllNotesFromDatabase(sectionIds) {
  try {
    const response = await fetch("/api/ebook-notes", {
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("ebook_notes_load_failed");
    const body = await response.json();
    const rows = Array.isArray(body.notes) ? body.notes : [];

    const result = {};
    const migrations = [];
    for (const sectionId of sectionIds) {
      const databaseNotes = rows
        .filter((note) => note.sectionId === sectionId)
        .map(normalizeNote);
      const localNotes = loadNotes(sectionId).map(normalizeNote);
      const migrated =
        window.localStorage.getItem(migrationKey(sectionId)) === "1";
      const notes = migrated
        ? databaseNotes
        : mergeFirstMigration(databaseNotes, localNotes);
      result[sectionId] = notes;
      saveNotes(sectionId, notes);
      if (!migrated) migrations.push(syncNotesToDatabase(sectionId, notes));
    }
    await Promise.allSettled(migrations);
    return result;
  } catch {
    return Object.fromEntries(
      sectionIds.map((sectionId) => [sectionId, loadNotes(sectionId)])
    );
  }
}
