import type { TestDefinition } from "./types";
import { personalityBasic } from "./definitions/personalityBasic";

export const TESTS: TestDefinition[] = [
  personalityBasic,
];

export function getTestBySlug(slug: string) {
  return TESTS.find(t => t.slug === slug);
}

export function getTestById(id: string) {
  return TESTS.find(t => t.id === id);
}
