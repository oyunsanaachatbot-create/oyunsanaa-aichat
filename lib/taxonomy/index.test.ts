import { describe, expect, it } from "vitest";
import { TAXONOMY, PROFESSIONAL_TAXONOMY, getAllStaticTagOptions, getCategory, getProfessionalPlacements, getStaticTag, inferTaxonomyFromText, isTaxonomyPathValid, normalizeTagKey } from "./index";
import { TAG_BANK_2026 } from "./unified";

describe("one shared 2026 subject bank",()=>{
 it("loads all uploaded rows and keeps both calling interfaces on the same eight directions",()=>{
  expect(TAG_BANK_2026.length).toBe(582);
  expect(TAXONOMY.length).toBe(8);
  expect(TAXONOMY.map(category=>category.code)).toEqual(PROFESSIONAL_TAXONOMY.map(category=>category.code));
  expect(TAXONOMY.flatMap(category=>category.subcategories).length).toBe(51);
  expect(getAllStaticTagOptions().length).toBeGreaterThan(0);
  expect(TAG_BANK_2026.every(row=>getStaticTag(normalizeTagKey(row.label)) !== null)).toBe(true);
  expect(TAG_BANK_2026.filter(row=>row.kind === "Сэдэв").every(row=>getProfessionalPlacements(row.label).length>0)).toBe(true);
 });
 it("classifies an exact supplied topic from every direction into the new path",()=>{
  for(const category of TAXONOMY){
   const subcategory=category.subcategories[0],label=subcategory.types[0].tags[0];
   const inferred=inferTaxonomyFromText(label);
   // Identical approved labels may legitimately occur in several directions.
   expect(getProfessionalPlacements(label)).toContainEqual({categoryCode:inferred?.categoryCode,subcategoryCode:inferred?.subcategoryCode});
   expect(inferred?.primaryTagKey).toBe(normalizeTagKey(label));
   expect(isTaxonomyPathValid(inferred!)).toBe(true);
  }
 });
 it("preserves legacy category lookup without offering legacy categories for new input",()=>{
  expect(getCategory("e1")?.name).toBe("Дотоод ертөнц ба төлөвшил");
  expect(TAXONOMY.some(category=>category.code === "e1")).toBe(false);
  expect(isTaxonomyPathValid({categoryCode:"1",subcategoryCode:"1.1",taxonomyType:"old"})).toBe(false);
  expect(inferTaxonomyFromText("   ")).toBe(null);
 });
});
