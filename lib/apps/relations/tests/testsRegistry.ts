import type { TestDefinition } from "./types";
import { personalityBasic } from "./definitions/personalityBasic"; // ✅ яг файлын нэртэй адил

export const TESTS: TestDefinition[] = [
  personalityBasic,
  // дараа нэмэх тестүүд:
  // communicationStyle,
];

export function getTestBySlug(slug: string) {
  return TESTS.find((t) => t.slug === slug);
}

export function getTestById(id: string) {
  return TESTS.find((t) => t.id === id);
}
