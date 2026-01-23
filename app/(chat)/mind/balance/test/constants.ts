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

// UI дээр ХАРИУЛТ "ТИЙМ"-ЭЭС эхэлнэ ✅
export const BALANCE_SCALE = [
  { label: "Тийм", value: 4 },
  { label: "Ихэвчлэн", value: 3 },
  { label: "Дунд зэрэг", value: 2 },
  { label: "Заримдаа", value: 1 },
  { label: "Үгүй", value: 0 },
] as const;

export type BalanceValue = (typeof BALANCE_SCALE)[number]["value"];

export const DOMAIN_APP_LINK: Record<
  BalanceDomain,
  { title: string; href: string; blurb: string }
> = {
  emotion: {
    title: "Сэтгэл санаа",
    href: "/mind/emotion",
    blurb: "Өдөр бүр 5–10 минут өөрийгөө тайвшруулах, бодлоо ажиглах дадал.",
  },
  self: {
    title: "Өөрийгөө ойлгох",
    href: "/mind/self",
    blurb: "Өөрийн хэв маяг, хэрэгцээгээ ойлгож, өөртөө зөв хандах алхмууд.",
  },
  relations: {
    title: "Харилцаа",
    href: "/mind/relations",
    blurb: "Эрүүл хил хязгаар, сонсох чадвар, зөөлөн илэрхийлэх дадал.",
  },
  purpose: {
    title: "Зорилго, утга учир",
    href: "/mind/purpose",
    blurb: "Юу чухал вэ гэдгээ тодруулж, жижиг зорилгоо өдөр бүр ахиулах.",
  },
  selfCare: {
    title: "Өөрийгөө хайрлах",
    href: "/mind/self-care",
    blurb: "Өөрийгөө буруутгах биш дэмжих, амрах/сэргээх дадал.",
  },
  life: {
    title: "Тогтвортой байдал",
    href: "/mind/life",
    blurb: "Нойр, хөдөлгөөн, орчин, санхүү зэрэг сууриа тогтвортой болгох.",
  },
};
