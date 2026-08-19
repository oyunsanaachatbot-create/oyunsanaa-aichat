import assert from "node:assert/strict";
import test from "node:test";
import { TESTS } from "./testsRegistry";

test("psychology test hub exposes all eight restored tests", () => {
  assert.equal(TESTS.length, 8);
  assert.equal(new Set(TESTS.map((item) => item.id)).size, TESTS.length);
  assert.equal(new Set(TESTS.map((item) => item.slug)).size, TESTS.length);
});

test("every restored test can produce a conclusion", () => {
  for (const item of TESTS) {
    assert.ok(item.questions.length > 0, `${item.id} has no questions`);
    assert.ok(item.bands.length > 0, `${item.id} has no result bands`);
    assert.ok(
      item.bands.every((band) => band.summary.length > 0),
      `${item.id} has an empty conclusion`
    );
  }
});

test("every visible test declares its source and usage status", () => {
  for (const item of TESTS) {
    assert.ok(item.origin, `${item.id} has no origin`);
    assert.ok(item.source?.name, `${item.id} has no source`);
    assert.ok(item.source?.usageRights, `${item.id} has no usage rights`);
  }
});
