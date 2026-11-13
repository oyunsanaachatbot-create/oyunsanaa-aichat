import assert from "node:assert/strict";
import test from "node:test";
import { PROFESSIONAL_TAXONOMY, isTaxonomyPathValid } from "./index";

test("subjects cannot be assigned to a different direction", () => {
  for (const owner of PROFESSIONAL_TAXONOMY) for (const category of PROFESSIONAL_TAXONOMY) {
    const subject=owner.subcategories[0];
    assert.equal(isTaxonomyPathValid({categoryCode:category.code,subcategoryCode:subject.code,taxonomyType:subject.name}),category.code===owner.code);
  }
});
