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

export const DOMAIN_LABELS: Record<BalanceDomain, string> = {
  emotion: "Сэтгэл санаа",
  self: "Өөрийгөө ойлгох",
  relations: "Харилцаа",
  purpose: "Зорилго, утга учир",
  selfCare: "Өөрийгөө хайрлах",
  life: "Тогтвортой байдал",
};

export const BALANCE_SCALE = [
  { label: "Тийм", value: 4 },
  { label: "Ихэвчлэн", value: 3 },
  { label: "Дунд зэрэг", value: 2 },
  { label: "Заримдаа", value: 1 },
  { label: "Үгүй", value: 0 },
] as const;
