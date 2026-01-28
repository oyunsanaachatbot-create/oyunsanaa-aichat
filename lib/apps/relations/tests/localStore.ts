export type LatestResult = {
  test_slug: string;
  test_title: string;
  result_key: string;
  result_title: string;
  summary_short: string;
  created_at: string;
};

const KEY = "oyunsanaa:relations:tests:latest:v1";

export function loadLatestLocal(): LatestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LatestResult[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveLatestLocal(item: LatestResult) {
  if (typeof window === "undefined") return;
  const all = loadLatestLocal();
  const next = [item, ...all.filter((x) => x.test_slug !== item.test_slug)].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
}
