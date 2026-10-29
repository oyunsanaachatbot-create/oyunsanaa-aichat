import bank from "./tag-bank-2026.json" with { type: "json" };

export const TAG_BANK_2026 = bank;
/** One subject bank; both existing calling interfaces read these same categories. */
export const UNIFIED_PROFESSIONAL_TAXONOMY = [...new Map(bank.map(row => [row.categoryCode, row.category])).entries()].map(([code,name]) => {
  const rows = bank.filter(row => row.categoryCode === code && row.kind === "Сэдэв");
  return { code, name, subcategories: [...new Set(rows.map(row => row.subcategory))].map((name,index) => ({
    // New codes cannot silently reinterpret the old p1.1 / e1.1 assignments.
    code: `${code}n${index + 1}`, name, tags: rows.filter(row => row.subcategory === name).map(row => row.label),
  })) };
});
export const UNIFIED_TAXONOMY = UNIFIED_PROFESSIONAL_TAXONOMY.map(category => ({
  code: category.code, name: category.name, subcategories: category.subcategories.map(subcategory => ({
    code: subcategory.code, name: subcategory.name, types: [{ name: subcategory.name, tags: subcategory.tags }],
  })),
}));
export const SEARCH_TAG_HINTS = bank.filter(row => row.kind === "Хайлтын таг");
