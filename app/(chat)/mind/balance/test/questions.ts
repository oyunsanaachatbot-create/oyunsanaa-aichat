// app/(chat)/mind/balance/test/questions.ts
import type { BalanceDomain } from "./constants";

export type BalanceCategory = BalanceDomain;

export type BalanceOption = { label: string; value: number };

export type BalanceQuestionMeta = {
  id: string;
  domain: BalanceDomain;
  reverse?: boolean; // сөрөг асуулт бол true (Үгүй = сайн оноо болох тохиолдол)
};

// Question text lives in the i18n dictionary at apps.balance.questions[id]
export const BALANCE_QUESTIONS: BalanceQuestionMeta[] = [
  // ===================== 1) emotion =====================
  { id: "e1", domain: "emotion" },
  { id: "e2", domain: "emotion" },
  { id: "e3", domain: "emotion" },
  { id: "e4", domain: "emotion", reverse: true },
  { id: "e5", domain: "emotion" },
  { id: "e6", domain: "emotion" },

  // ===================== 2) self =====================
  { id: "s1", domain: "self" },
  { id: "s2", domain: "self" },
  { id: "s3", domain: "self" },
  { id: "s4", domain: "self" },
  { id: "s5", domain: "self" },
  { id: "s6", domain: "self" },

  // ===================== 3) relations =====================
  { id: "r1", domain: "relations" },
  { id: "r2", domain: "relations" },
  { id: "r3", domain: "relations" },
  { id: "r4", domain: "relations" },
  { id: "r5", domain: "relations" },
  { id: "r6", domain: "relations", reverse: true },
  { id: "r7", domain: "relations" },

  // ===================== 4) purpose =====================
  { id: "p1", domain: "purpose" },
  { id: "p2", domain: "purpose" },
  { id: "p3", domain: "purpose" },
  { id: "p4", domain: "purpose" },
  { id: "p5", domain: "purpose", reverse: true },
  { id: "p6", domain: "purpose" },
  { id: "p7", domain: "purpose" },

  // ===================== 5) selfCare =====================
  { id: "c1", domain: "selfCare" },
  { id: "c2", domain: "selfCare" },
  { id: "c3", domain: "selfCare" },
  { id: "c4", domain: "selfCare" },
  { id: "c5", domain: "selfCare", reverse: true },
  { id: "c6", domain: "selfCare" },

  // ===================== 6) life =====================
  { id: "l1", domain: "life" },
  { id: "l2", domain: "life" },
  { id: "l3", domain: "life" },
  { id: "l4", domain: "life" },
  { id: "l5", domain: "life" },
  { id: "l6", domain: "life" },
];
