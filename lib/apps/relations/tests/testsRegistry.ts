import type { TestDefinition } from "./types";
import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

export const TESTS: Array<{ slug: string; title: string; meta: string }> = [
  { slug: personalityBasic.slug, title: personalityBasic.title, meta: personalityBasic.meta },
  { slug: communicationStyle.slug, title: communicationStyle.title, meta: communicationStyle.meta },
];

const MAP: Record<string, TestDefinition> = {
  [personalityBasic.slug]: personalityBasic,
  [communicationStyle.slug]: communicationStyle,
};

export function getTestBySlug(slug: string): TestDefinition | null {
  return MAP[slug] ?? null;
}
