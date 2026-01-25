export type RelationsDailyEntry = {
  id: string;
  dateKey: string;
  person?: string;
  note?: string;
  scores: {
    listening: number;
    expression: number;
    empathy: number;
    boundaries: number;
  };
  updatedAt?: string;
};

const STORAGE_KEY = "oyunsanaa:relations:daily-check:v1";

// ❗ new Date() default ашиглахгүй
export function getTodayKey(d?: Date) {
  const dd = d ?? new Date();
  const yyyy = dd.getFullYear();
  const mm = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${day}`;
}

export function loadAllEntries(): RelationsDailyEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function upsertEntry(entry: RelationsDailyEntry) {
  const all = loadAllEntries();
  const idx = all.findIndex((e) => e.dateKey === entry.dateKey);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}
