import { getCategoryContent, getContentRecommendations } from "../lib/taxonomy/recommendations";
import { EDUCATION_CATEGORIES } from "../lib/content/education-categories";
import { getProfessionalTagOptions, PROFESSIONAL_TAXONOMY } from "../lib/taxonomy";

async function main() {
  if (new URL(process.env.POSTGRES_URL || "").pathname !== "/oyunsanaa_testing") throw new Error("Testing database required");
  const userId = "00000000-0000-0000-0000-000000000000";
  for (const category of EDUCATION_CATEGORIES) {
    const groups = await getCategoryContent({ categoryCode: category.code, userId });
    console.log("Runtime category verified", category.code, groups.reduce((sum, group) => sum + group.items.length, 0));
  }
  const category = PROFESSIONAL_TAXONOMY[0], subcategory = category.subcategories[0];
  const result = await getContentRecommendations({ userId, taxonomy: { categoryCode: category.code, subcategoryCode: subcategory.code, taxonomyType: subcategory.name, primaryTagKey: getProfessionalTagOptions(subcategory.code)[0].key, additionalTagKeys: [] } });
  console.log("Runtime TAG recommendations verified", result.groups.length);
}
main().then(() => process.exit(0)).catch(error => {
  console.error("Library runtime failed:", error?.name, error?.code, error?.message);
  process.exit(1);
});
