import type { TestDefinition } from "./types";

export type LatestTestResult = {
  testId: string;
  title: string;
  pct: number;
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

export function saveLatestLocal(test: TestDefinition, pct: number, bandTitle: string, summary: string) {
  if (typeof window === "undefined") return;

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
  ].slice(0, 6);

  localStorage.setItem(KEY, JSON.stringify(next));
}
