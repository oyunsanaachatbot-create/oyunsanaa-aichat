export type RelationsDailyEntry = {
  id: string;       // dateKey
  dateKey: string;  // YYYY-MM-DD

  person?: string;     // optional
  situation?: string;  // 1 өгүүлбэр
  response?: string;   // 1 өгүүлбэр
  nextTime?: string;   // 1 өгүүлбэр

  updatedAt?: string;  // ISO
};

const STORAGE_KEY = "oyunsanaa:relations:daily-learn:v2";

// ❗ default param дээр new Date() хэрэглэхгүй (build дээр safe)
export function getTodayKey(d?: Date) {
  const dd = d ?? new Date();
  const yyyy = dd.getFullYear();
  const mm = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${day}`;
}

export function loadAllEntries(): RelationsDailyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RelationsDailyEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(Boolean)
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)); // newest first
  } catch {
    return [];
  }
}

function saveAll(entries: RelationsDailyEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertEntry(entry: RelationsDailyEntry) {
  const all = loadAllEntries();
  const idx = all.findIndex((e) => e.dateKey === entry.dateKey);

  const next = [...all];
  if (idx >= 0) next[idx] = entry;
  else next.push(entry);

  next.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  saveAll(next);
  return next;
}
