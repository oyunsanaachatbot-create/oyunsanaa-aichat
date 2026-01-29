import type { TestDefinition } from "./types";
import { TESTS } from "./definitions";

export { TESTS };

export function getTestBySlug(slug: string): TestDefinition | undefined {
  return TESTS.find((t) => t.slug === slug);
}

export function getTestById(id: string): TestDefinition | undefined {
  return TESTS.find((t) => t.id === id);
}
