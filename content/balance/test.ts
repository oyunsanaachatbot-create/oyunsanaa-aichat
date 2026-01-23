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

// ✅ Хариулт: Тийм → Ихэвчлэн → Дунд → Заримдаа → Үгүй
export const BALANCE_SCALE = [
  { label: "Тийм", value: 4 },
  { label: "Ихэвчлэн", value: 3 },
  { label: "Дунд зэрэг", value: 2 },
  { label: "Заримдаа", value: 1 },
  { label: "Үгүй", value: 0 },
] as const;

export type BalanceChoiceValue = (typeof BALANCE_SCALE)[number]["value"];

export type BalanceQuestion = {
  id: string;
  domain: BalanceDomain;
  text: string;
};

export const BALANCE_QUESTIONS: BalanceQuestion[] = [
  // --- Сэтгэл санаа ---
  { id: "q1", domain: "emotion", text: "Сүүлийн үед таны сэтгэл санаа ерөнхийдөө тайван, тогтвортой байна уу?" },
  { id: "q2", domain: "emotion", text: "Өдөр тутмын жижиг зүйлсээс баяр баясгалан мэдэрч чаддаг уу?" },
  { id: "q3", domain: "emotion", text: "Та сөрөг бодлоо эерэг чиглэл рүү эргүүлж чаддаг уу?" },

  // --- Харилцаа ---
  { id: "q8", domain: "relations", text: "Та бусдыг ойлгож, тайван харилцах чадвар сайн гэж хэлж чадах уу?" },
  { id: "q9", domain: "relations", text: "Та өөрийн хэрэгцээ, мэдрэмжээ бусдад ойлгомжтой илэрхийлж чаддаг уу?" },
  { id: "q10", domain: "relations", text: "Та бусдад үгүй гэж хэлж, эрүүл хил хязгаар тавьж чаддаг уу?" },

  // --- Зорилго, утга учир ---
  { id: "q15", domain: "purpose", text: "Та одоогоор тодорхой зорилго, чиглэлтэй гэж хэлж чадах уу?" },
  { id: "q16", domain: "purpose", text: "Зорилгоо биелүүлэхийн тулд бодитой төлөвлөгөө гаргаж, жижиг алхмууд хийж чаддаг уу?" },
  { id: "q17", domain: "purpose", text: "Эхэлсэн зүйлээ ихэнхдээ дуусгаж чаддаг уу?" },

  // --- Тогтвортой байдал ---
  { id: "q28", domain: "life", text: "Амьдрах орчин тань ерөнхийдөө тайван, аюулгүй, тав тухтай гэж хэлж чадах уу?" },
  { id: "q29", domain: "life", text: "Гэртээ байхдаа үнэхээр амарч, эрч хүчээ нөхөж чаддаг уу?" },
  { id: "q30", domain: "life", text: "Ажлын орчин тань дэмжлэг өгдөг тал нь бухимдуулгаасаа илүү юу?" },

  // --- Өөрийгөө ойлгох (placeholder – чи дараа нь асуултуудаа нэмнэ) ---
  { id: "qS1", domain: "self", text: "Та өөрийн давуу тал, сул талаа бодитоор мэддэг гэж хэлж чадах уу?" },
  { id: "qS2", domain: "self", text: "Та шийдвэр гаргахдаа өөрийн үнэт зүйлдээ тулгуурладаг уу?" },

  // --- Өөрийгөө хайрлах (placeholder) ---
  { id: "qC1", domain: "selfCare", text: "Та өөртөө эелдэг, энэрэнгүй хандаж чаддаг уу?" },
  { id: "qC2", domain: "selfCare", text: "Та амрах, сэргээх цагийг тогтмол гаргаж чаддаг уу?" },
];
