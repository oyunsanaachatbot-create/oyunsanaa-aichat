import type { TestDefinition } from "./types";
import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

export const TESTS: TestDefinition[] = [
  personalityBasic,
  communicationStyle,
];

export function getTestBySlug(slug: string) {
  return TESTS.find((t) => t.slug === slug);
}

export function getTestById(id: string) {
  return TESTS.find((t) => t.id === id);
}
