export type RelationsDailyEntry = {
  id: string; // dateKey-based
  dateKey: string; // YYYY-MM-DD
  person?: string;
  note?: string;
  scores: {
    listening: number;
    expression: number;
    empathy: number;
    boundaries: number;
  };
  updatedAt?: string; // ISO
};

const STORAGE_KEY = "oyunsanaa:relations:daily-check:v1";

export function getTodayKey(d = new Date()) {
  // local date -> YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function loadAllEntries(): RelationsDailyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RelationsDailyEntry[];
    if (!Array.isArray(parsed)) return [];
    // Sort newest first by dateKey
    return parsed
      .filter(Boolean)
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0));
  } catch {
    return [];
  }
}

function saveAll(entries: RelationsDailyEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertEntry(entry: RelationsDailyEntry): RelationsDailyEntry[] {
  const all = loadAllEntries();
  const idx = all.findIndex((e) => e.dateKey === entry.dateKey);

  const next = [...all];
  if (idx >= 0) next[idx] = entry;
  else next.push(entry);

  // Normalize order
  next.sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0));
  saveAll(next);
  return next;
}
