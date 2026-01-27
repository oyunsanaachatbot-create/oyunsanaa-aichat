export type Pick = "yes" | "some" | "no";
export type Mood = "😊" | "🙂" | "😐" | "😕" | "😣" | "😡";

export type RelationsDailyEntry = {
  id: string;
  dateKey: string;

  person?: string;

  // ❗ одоо OPTIONAL БИШ → Type алдаа гарахгүй
  listening: Pick;
  expression: Pick;
  empathy: Pick;

  mood?: Mood;
  note?: string;

  updatedAt?: string;
};

const STORAGE_KEY = "oyunsanaa:relations:daily-check:v4";

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<RelationsDailyEntry>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((e) => ({
        id: e.id!,
        dateKey: e.dateKey!,
        person: e.person,
        listening: e.listening ?? "some",
        expression: e.expression ?? "some",
        empathy: e.empathy ?? "some",
        mood: e.mood,
        note: e.note,
        updatedAt: e.updatedAt,
      }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  } catch {
    return [];
  }
}

function saveAll(entries: RelationsDailyEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
