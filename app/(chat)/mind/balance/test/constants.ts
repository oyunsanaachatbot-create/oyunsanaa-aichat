// app/(chat)/mind/balance/test/constants.ts
export type BalanceDomain =
  | "emotion"
  | "self"
  | "relations"
  | "purpose"
  | "selfCare"
  | "life";

export const DOMAIN_LABEL: Record<BalanceDomain, string> = {
  emotion: "Сэтгэл санаа",
  self: "Өөрийгөө ойлгох",
  relations: "Харилцаа",
  purpose: "Зорилго, утга учир",
  selfCare: "Өөрийгөө хайрлах",
  life: "Тогтвортой байдал",
};

// ДЭЛГЭЦ ДЭЭРХ ДАРААЛАЛ: Тийм → Ихэвчлэн → Дунд зэрэг → Заримдаа → Үгүй
export const BALANCE_SCALE = [
  { label: "Тийм", value: 4 },
  { label: "Ихэвчлэн", value: 3 },
  { label: "Дунд зэрэг", value: 2 },
  { label: "Заримдаа", value: 1 },
  { label: "Үгүй", value: 0 },
] as const;

export type BalanceValue = (typeof BALANCE_SCALE)[number]["value"]; // 0|1|2|3|4

export const BRAND = {
  hex: "#1F6FB2",
  rgb: "31,111,178",
};
