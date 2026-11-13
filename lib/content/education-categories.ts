// Learning navigation is explicit; the approved TAG bank remains independent.
export const EDUCATION_CATEGORIES = [
  { code: "p1", number: "1", name: "Сэтгэл зүй", question: "Би ямар хүн бэ?", legacyCodes: ["e1", "e2", "e4", "e8"] },
  { code: "p2", number: "2", name: "Эрүүл мэнд", question: "Миний эрүүл мэнд, дадал ямар байна вэ?", legacyCodes: ["e5"] },
  { code: "p7", number: "3", name: "Боловсрол", question: "Би хэрхэн ажиллаж, сурч байна вэ?", legacyCodes: ["e6"] },
  { code: "p3", number: "4", name: "Санхүү", question: "Миний санхүүгийн байдал ямар байна вэ?", legacyCodes: ["e7"] },
  { code: "p8", number: "5", name: "Хууль", question: "Би хуулийн талаар хэр мэдлэгтэй вэ?", legacyCodes: [] },
  { code: "p10", number: "6", name: "Нийгэм", question: "Би бусадтай хэрхэн харилцдаг вэ?", legacyCodes: ["e3"] },
  { code: "p11", number: "7", name: "Технологи", question: "Технологи надад хэрхэн нөлөөлж байна вэ?", legacyCodes: ["e10"] },
  { code: "p9", number: "8", name: "Амьдрах орчин", question: "Миний амьдрах орчин ямар байна вэ?", legacyCodes: ["e9"] },
];

export type EducationCategoryCode = (typeof EDUCATION_CATEGORIES)[number]["code"];
export function getEducationCategory(code: string) {
  return EDUCATION_CATEGORIES.find(category => category.code === code || category.legacyCodes.includes(code)) ?? null;
}
