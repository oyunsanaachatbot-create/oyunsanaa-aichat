import assert from "node:assert/strict";
import test from "node:test";
import { EDUCATION_CATEGORIES } from "./education-categories";

test("emotional education exposes the eight ordered categories", () => {
  assert.equal(EDUCATION_CATEGORIES.length, 8);
  assert.deepEqual(
    EDUCATION_CATEGORIES.map((item) => item.code),
    ["1", "2", "3", "4", "5", "6", "7", "8"]
  );
  assert.equal(
    new Set(EDUCATION_CATEGORIES.map((item) => item.name)).size,
    EDUCATION_CATEGORIES.length
  );
});
