import type { TestDefinition } from "./types";

import { boundaries } from "./definitions/boundaries";
import { communicationStyle } from "./definitions/communicationStyle";
import { conflict } from "./definitions/conflict";
import { empathy } from "./definitions/empathy";
import { listening } from "./definitions/listening";
import { personalityBasic } from "./definitions/personalityBasic";
import { toxicBehavior } from "./definitions/toxicBehavior";
import { trust } from "./definitions/trust";

// ✅ Нийт 8 тест (хуучин 2 + шинэ 6)
export const TESTS: TestDefinition[] = [
  communicationStyle,
  personalityBasic,

  listening,
  empathy,
  boundaries,
  conflict,
  trust,
  toxicBehavior,
];

// ✅ helper-ууд (page.tsx дээр хэрэгтэй)
export function getTestById(id: string) {
  return TESTS.find((t) => t.id === id) ?? null;
}

export function getTestBySlug(slug: string) {
  return TESTS.find((t) => t.slug === slug) ?? null;
}
