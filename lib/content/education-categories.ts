import educationSections from "../taxonomy/taxonomy.json" with { type: "json" };

// These are the existing learning sections and their saved e1–e10 URLs.
// They are navigation, not the selectable TAG bank. Updating TAGs must not
// remove the section headings or disconnect previously published programs.
export const EDUCATION_CATEGORIES = educationSections.filter(
  (category) => category.group === "Сэтгэлийн боловсролоор"
).map((category, index) => ({
  code: category.code,
  number: String(index + 1),
  name: category.name,
  question: category.question ?? "",
}));

export type EducationCategoryCode =
  (typeof EDUCATION_CATEGORIES)[number]["code"];
