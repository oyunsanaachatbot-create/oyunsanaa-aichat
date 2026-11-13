import assert from "node:assert/strict";
import test from "node:test";
import { EDUCATION_CATEGORIES, getEducationCategory } from "./education-categories";
import { PROFESSIONAL_TAXONOMY } from "../taxonomy";

test("eight learning questions and TAG directions follow the approved display order", () => {
  const codes = ["p1", "p2", "p7", "p3", "p8", "p10", "p11", "p9"];
  assert.deepEqual(EDUCATION_CATEGORIES.map(item => item.code), codes);
  assert.deepEqual(PROFESSIONAL_TAXONOMY.map(item => item.code), codes);
  assert.deepEqual(EDUCATION_CATEGORIES.map(item => item.question), [
    "Би ямар хүн бэ?",
    "Миний эрүүл мэнд, дадал ямар байна вэ?",
    "Би хэрхэн ажиллаж, сурч байна вэ?",
    "Миний санхүүгийн байдал ямар байна вэ?",
    "Би хуулийн талаар хэр мэдлэгтэй вэ?",
    "Би бусадтай хэрхэн харилцдаг вэ?",
    "Технологи надад хэрхэн нөлөөлж байна вэ?",
    "Миний амьдрах орчин ямар байна вэ?",
  ]);
  assert.equal(EDUCATION_CATEGORIES[2].name, "Боловсрол");
});

test("saved education links still resolve while unknown categories remain missing", () => {
  for (let number = 1; number <= 10; number++) assert.ok(getEducationCategory(`e${number}`));
  assert.equal(getEducationCategory("e6")?.code, "p7");
  assert.equal(getEducationCategory("unknown"), null);
  for (const item of EDUCATION_CATEGORIES) assert.equal(getEducationCategory(item.code), item);
});
