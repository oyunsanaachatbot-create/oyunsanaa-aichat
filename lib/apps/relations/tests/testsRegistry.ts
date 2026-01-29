import type { TestDefinition } from "./types";
import { personalityBasic } from "./definitions/personality-basic";

// Дараа нь энд өөр тестүүдээ нэмнэ:
// import { communicationStyle } from "./definitions/communication-style";

export const TESTS: TestDefinition[] = [
  personalityBasic,
  // communicationStyle,
];

export function getTestBySlug(slug: string): TestDefinition | undefined {
  return TESTS.find((t) => t.slug === slug);
}
