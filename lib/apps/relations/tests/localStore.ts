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

function normalizePct(pctRaw: number): number {
  // pctRaw нь зарим газраас 0..1 (0.9), зарим нь 0..100 (90) ирж болно
  if (!Number.isFinite(pctRaw)) return 0;

  const pct = pctRaw <= 1 ? Math.round(pctRaw * 100) : Math.round(pctRaw);

  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return pct;
}

export function saveLatestLocal(
  test: TestDefinition,
  pctRaw: number,
  bandTitle: string,
  summary: string
) {
  if (typeof window === "undefined") return;

  const pct = normalizePct(pctRaw);

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
  ].slice(0, 8); // ✅ 8 тесттэй таарууллаа

  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearLatest() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
