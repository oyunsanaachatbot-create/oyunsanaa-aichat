import assert from "node:assert/strict";
import test from "node:test";
import { EDUCATION_CATEGORIES } from "./education-categories";

test("emotional education exposes the ten ordered categories", () => {
  assert.equal(EDUCATION_CATEGORIES.length, 10);
  assert.deepEqual(
    EDUCATION_CATEGORIES.map((item) => item.code),
    ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"]
  );
  assert.ok(EDUCATION_CATEGORIES.every((item) => item.question.length > 0));
  assert.equal(
    new Set(EDUCATION_CATEGORIES.map((item) => item.name)).size,
    EDUCATION_CATEGORIES.length
  );
});
