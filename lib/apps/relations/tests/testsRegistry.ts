import type { TestDefinition } from "./types";

import { personalityBasic } from "./definitions/personalityBasic";
import { communicationStyle } from "./definitions/communicationStyle";

import { listening } from "./definitions/listening";
import { empathy } from "./definitions/empathy";
import { boundaries } from "./definitions/boundaries";
import { conflict } from "./definitions/conflict";
import { trust } from "./definitions/trust";
import { toxicBehavior } from "./definitions/toxicBehavior";

export const TESTS: TestDefinition[] = [
  // эхний 2
  personalityBasic,
  communicationStyle,

  // шинэ 5
  listening,
  empathy,
  boundaries,
  conflict,
  trust,

  // токсик
  toxicBehavior,
];
