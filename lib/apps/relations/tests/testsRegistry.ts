import type { TestDefinition } from "./types";

import { listening } from "./definitions/listening";
import { empathy } from "./definitions/empathy";
import { boundaries } from "./definitions/boundaries";
import { conflict } from "./definitions/conflict";
import { trust } from "./definitions/trust";
import { toxicTraits } from "./definitions/toxicTraits";

export const TESTS: TestDefinition[] = [
  listening,
  empathy,
  boundaries,
  conflict,
  trust,
  toxicTraits,
];

export function getTestById(id: string) {
  return TESTS.find((t) => t.id === id);
}

export function getTestBySlug(slug: string) {
  return TESTS.find((t) => t.slug === slug);
}
