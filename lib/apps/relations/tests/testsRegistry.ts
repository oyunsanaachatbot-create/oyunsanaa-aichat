import type { TestDefinition } from "./types";

import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

// ✅ ШИНЭ 6 тест
import { listeningTest } from "./definitions/listening";
import { empathyTest } from "./definitions/empathy";
import { boundariesTest } from "./definitions/boundaries";
import { conflictTest } from "./definitions/conflict";
import { trustTest } from "./definitions/trust";
import { toxicTraitsTest } from "./definitions/toxicTraits";

export const TESTS: TestDefinition[] = [
  personalityBasic,
  communicationStyle,

  listeningTest,
  empathyTest,
  boundariesTest,
  conflictTest,
  trustTest,
  toxicTraitsTest,
];

export function getTestById(id: string) {
  return TESTS.find(t => t.id === id);
}
export function getTestBySlug(slug: string) {
  return TESTS.find(t => t.slug === slug);
}
