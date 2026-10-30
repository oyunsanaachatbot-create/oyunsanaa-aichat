import test from "node:test";
import assert from "node:assert/strict";
import bank from "./tag-bank-2026.json";
import previous from "./previous-taxonomy.json";
import { PROFESSIONAL_TAXONOMY, getProfessionalTagOptions, getAllStaticTagOptions, isTaxonomyPathValid, normalizeTagKey } from "./index";

test("approved workbook supplies eight directions, 51 subcategories and all 430 age placements", () => {
  assert.equal(PROFESSIONAL_TAXONOMY.length, 8);
  assert.equal(PROFESSIONAL_TAXONOMY.flatMap(category => category.subcategories).length, 51);
  assert.equal(bank.filter(row => !row.audiences.length).length, 152);
  assert.equal(bank.filter(row => row.audiences.length).length, 430);
  for (const category of PROFESSIONAL_TAXONOMY) for (const subcategory of category.subcategories) {
    for (const age of ["CHILD", "ADOLESCENT", "ADULT", "SENIOR"]) {
      const expected = [...new Set(bank.filter(row => row.subcategoryCode === subcategory.code && row.audiences.includes(age)).map(row => normalizeTagKey(row.label)))].sort();
      assert.deepEqual(getProfessionalTagOptions(subcategory.code, [age]).map(tag => tag.key).sort(), expected);
    }
  }
  assert(getAllStaticTagOptions(["CHILD"]).some(tag => tag.label === "Хүүхдийн зан чанар, онцлог"));
  assert(!getProfessionalTagOptions("p1n31_1", ["CHILD"]).some(tag => tag.label === "Хэрэгцээ, үнэт зүйл"));
});

test("old saved paths retain their meaning but are absent from new category choices", () => {
  for (const category of previous) for (const subcategory of category.subcategories) {
    assert(isTaxonomyPathValid({ categoryCode: category.code, subcategoryCode: subcategory.code, taxonomyType: subcategory.name }));
    assert(!PROFESSIONAL_TAXONOMY.some(category => category.subcategories.some(item => item.code === subcategory.code)));
  }
});
