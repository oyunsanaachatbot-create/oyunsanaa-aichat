import bank from "./tag-bank-2026.json";

export const TAG_BANK_2026 = bank;
export const UNIFIED_PROFESSIONAL_TAXONOMY = [...new Map(bank.map(row => [row.categoryCode, row.category])).entries()].map(([code, name]) => ({
  code, name, subcategories: [...new Map(bank.filter(row => row.categoryCode === code).map(row => [row.subcategoryCode, row.subcategory])).entries()].map(([code, name]) => ({
    code, name, tags: [...new Set(bank.filter(row => row.subcategoryCode === code).map(row => row.label))],
  })),
}));
export const UNIFIED_TAXONOMY = UNIFIED_PROFESSIONAL_TAXONOMY.map(category => ({
  code: category.code, name: category.name, subcategories: category.subcategories.map(subcategory => ({
    code: subcategory.code, name: subcategory.name, types: [{ name: subcategory.name, tags: subcategory.tags }],
  })),
}));
// The approved workbook contains subjects only, with no separate search-hint bank.
export const SEARCH_TAG_HINTS: Array<{ label: string }> = [];

const ageAliases: Record<string, string> = { child: "CHILD", teen: "ADOLESCENT", adult: "ADULT", senior: "SENIOR" };
/** No target / all ages exposes the whole bank. Specific ages use only their workbook columns. */
export function ageTagLabels(audiences?: readonly string[], subcategoryCode?: string): string[] | null {
  if (!audiences?.length || audiences.some(age => ["ALL_AGES", "INDIVIDUAL", "all", "person"].includes(age))) return null;
  if (subcategoryCode && !bank.some(row => row.subcategoryCode === subcategoryCode)) return null;
  const ages = audiences.map(age => ageAliases[age] || age).filter(age => ["CHILD", "ADOLESCENT", "ADULT", "SENIOR"].includes(age));
  if (!ages.length) return null;
  return [...new Set(bank.filter(row => (!subcategoryCode || row.subcategoryCode === subcategoryCode) && row.audiences.some(age => ages.includes(age))).map(row => row.label))];
}
