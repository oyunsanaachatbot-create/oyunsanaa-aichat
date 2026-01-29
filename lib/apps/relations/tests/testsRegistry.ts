import type { TestDefinition } from "./types";

import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

/**
 * НЭГ СТАНДАРТ:
 * - slug: URL дээр ашиглагдана  (жишээ: /mind/relations/tests/personality-basic)
 * - id: дотоод ID (асуултын key) байж болно (slug-тэй ижил байлгавал бүр амар)
 *
 * Доор slug нь үргэлж string байх ёстой!
 */
const ALL: TestDefinition[] = [personalityBasic, communicationStyle];

// ✅ жагсаалт (UI дээр харуулах)
export const TESTS: Array<{ slug: string; title: string; subtitle?: string }> = ALL.map((t) => ({
  slug: String((t as any).slug ?? (t as any).id), // fallback
  title: t.title,
  subtitle: (t as any).subtitle,
}));

// ✅ registry (slug болон id хоёуланг нь map-д оруулна)
const MAP: Record<string, TestDefinition> = {};
for (const t of ALL) {
  const slug = String((t as any).slug ?? (t as any).id);
  const id = String((t as any).id ?? slug);

  MAP[slug] = t;
  MAP[id] = t; // id-аар ч олдог болгоно
}

export function getTestBySlug(slug: string): TestDefinition | null {
  return MAP[String(slug)] ?? null;
}

export function getTestById(id: string): TestDefinition | null {
  return MAP[String(id)] ?? null;
}
