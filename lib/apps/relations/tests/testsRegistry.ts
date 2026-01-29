import type { TestDefinition } from "./types";
import { personalityBasic } from "./definitions/personality-basic";
// import { communicationStyle } from "./definitions/communication-style";

export const TESTS: TestDefinition[] = [
  personalityBasic,
  // communicationStyle,
];

export function getTestBySlug(slug: string) {
  return TESTS.find(t => t.slug === slug);
}
