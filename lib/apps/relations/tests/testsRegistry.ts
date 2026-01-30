import type { TestDefinition } from "./types";

import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

// Дараа нь шинэ тестүүд нэмэх бол энд import хийнэ
// import { listening } from "./definitions/listening";

export const TESTS: TestDefinition[] = [
  personalityBasic,
  communicationStyle,
  // listening,
];

export function getTestById(id: string) {
  return TESTS.find((t) => t.id === id);
}

export function getTestBySlug(slug: string) {
  return TESTS.find((t) => t.slug === slug);
}
