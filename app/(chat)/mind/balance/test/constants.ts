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

// ✅ Хариултын дараалал: Тийм → Ихэвчлэн → Дунд → Заримдаа → Үгүй
export const BALANCE_SCALE = [
  { label: "Тийм", value: 4 },
  { label: "Ихэвчлэн", value: 3 },
  { label: "Дунд зэрэг", value: 2 },
  { label: "Заримдаа", value: 1 },
  { label: "Үгүй", value: 0 },
] as const;

export type BalanceChoiceValue = (typeof BALANCE_SCALE)[number]["value"];
