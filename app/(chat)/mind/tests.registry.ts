// app/(chat)/mind/tests.registry.ts
export type TestMeta = {
  slug: string;
  title: string;        // хэрэглэгчид харагдах гарчиг
  short: string;        // 1 мөр тайлбар (optional)
};

export const TESTS: Record<string, TestMeta> = {
  "mind-balance": {
    slug: "mind-balance",
    title: "Сэтгэлийн тэнцвэрийн тест",
    short: "Сэтгэл санаа, харилцаа, тогтвортой байдал, өөрийгөө ойлгох, өөрийгөө хайрлах, зорилго-утга учрыг хэмжинэ.",
  },
};

export function getTestMeta(slug: string): TestMeta {
  return TESTS[slug] ?? { slug, title: slug, short: "" };
}
