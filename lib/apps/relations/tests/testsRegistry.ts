import type { TestDefinition } from "./types";

import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

export const TESTS: Array<{ id: string; title: string; subtitle?: string }> = [
  { id: personalityBasic.id, title: personalityBasic.title, subtitle: personalityBasic.subtitle },
  { id: communicationStyle.id, title: communicationStyle.title, subtitle: communicationStyle.subtitle },
];

const MAP: Record<string, TestDefinition> = {
  [personalityBasic.id]: personalityBasic,
  [communicationStyle.id]: communicationStyle,
};

export function getTestById(id: string): TestDefinition | null {
  return MAP[id] ?? null;
}

// Хуучин нэрээр хаа нэгтээ дуудаж байвал ажиллуулж өгөх “alias”
export const getTestBySlug = getTestById;
