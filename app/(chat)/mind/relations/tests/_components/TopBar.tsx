import type { TestDefinition } from "./types";

export type LatestTestResult = {
  testId: string;
  title: string;
  pct: number; // ✅ always 0..100
  bandTitle: string;
  summary: string;
  savedAtISO: string;
};

const KEY = "oyunsanaa:relations:tests:latest:v1";

export function loadLatest(): LatestTestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LatestTestResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLatestLocal(
  test: TestDefinition,
  pctRaw: number, // 0..1 or 0..100
  bandTitle: string,
  summary: string
) {
  if (typeof window === "undefined") return;

  // ✅ normalize to 0..100
  const pct =
    Number.isFinite(pctRaw) === false
      ? 0
      : pctRaw <= 1
      ? Math.round(pctRaw * 100)
      : Math.round(pctRaw);

  const current = loadLatest();

  const next: LatestTestResult[] = [
    {
      testId: test.id,
      title: test.title,
      pct,
      bandTitle,
      summary,
      savedAtISO: new Date().toISOString(),
    },
    ...current.filter((x) => x.testId !== test.id),
  ].slice(0, 8); // ✅ 8 тест

  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearLatest() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
