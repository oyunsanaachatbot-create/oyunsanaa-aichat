// app/(chat)/mind/balance/test/constants.ts

export type BalanceDomain =
  | "emotion"
  | "self"
  | "relations"
  | "purpose"
  | "selfCare"
  | "life";

export const BRAND = {
  hex: "#1F6FB2",
  rgb: "31,111,178",
} as const;

// Default scale values (4..0), labels come from the i18n dictionary (apps.balance.scaleLabels)
export const BALANCE_SCALE_VALUES = [4, 3, 2, 1, 0] as const;

// localStorage keys
export const BALANCE_LAST_KEY = "balance:lastResult";
export const BALANCE_HISTORY_KEY = "balance:history";
