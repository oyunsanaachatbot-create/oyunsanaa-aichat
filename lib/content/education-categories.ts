import { TAXONOMY } from "../taxonomy/index";

export const EDUCATION_CATEGORIES = TAXONOMY.filter(
  (category) => category.group === "Сэтгэлийн боловсролоор"
).map((category, index) => ({
  code: category.code,
  number: String(index + 1),
  name: category.name,
  question: category.question ?? "",
}));

export type EducationCategoryCode =
  (typeof EDUCATION_CATEGORIES)[number]["code"];
