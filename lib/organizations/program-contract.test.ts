import assert from "node:assert/strict";
import test from "node:test";
import { contentPolicy, organizationContentTypes, safePartition, validateContent } from "./program-contract";
import { validateEmployeeValue } from "./response-validation";

test("employee and website wire policy covers exactly 18 content types", () => {
  assert.equal(organizationContentTypes.length, 18);
  assert.equal(new Set(organizationContentTypes).size, 18);
  for (const type of organizationContentTypes) assert.ok(contentPolicy[type]?.measurement);
  assert.equal(contentPolicy.PERSONAL_QUESTION.privacy, "PERSONAL_ONLY");
});

test("employee responses use the type-specific control", () => {
  assert.equal(validateEmployeeValue("CHECK_IN", { title: "Mood", prompt: "Today?", responseType: "SCALE_1_5" }, 3), true);
  assert.equal(validateEmployeeValue("CHECK_IN", { title: "Mood", prompt: "Today?", responseType: "SCALE_1_5" }, 6), false);
  assert.equal(validateEmployeeValue("SURVEY", { title: "Survey", questions: [{ id: "q1", prompt: "Pick", responseType: "SINGLE_CHOICE", options: ["A", "B"] }] }, { q1: "A" }), true);
  assert.equal(validateEmployeeValue("SURVEY", { title: "Survey", questions: [{ id: "q1", prompt: "Pick", responseType: "SINGLE_CHOICE", options: ["A", "B"] }] }, { q1: "C" }), false);
  assert.equal(validateEmployeeValue("SUGGESTION", { title: "Ideas", options: ["One", "Two"] }, { selected: ["One"] }), true);
  assert.equal(validateEmployeeValue("SUGGESTION", { title: "Ideas", options: ["One", "Two"] }, { selected: ["Other"] }), false);
  assert.equal(validateEmployeeValue("ASSESSMENT", { title: "Assessment", assessmentProgramVersionId: "version" }, true), false);
});

test("the shared privacy floor suppresses a two-person cell and complements", () => {
  assert.deepEqual(safePartition(2, [2, 0], 3), { total: null, parts: [null, null] });
  assert.deepEqual(safePartition(4, [3, 1], 3), { total: 4, parts: [null, null] });
  assert.deepEqual(safePartition(6, [3, 3], 3), { total: 6, parts: [3, 3] });
  assert.ok(validateContent("IMPLEMENTATION", { title: "Record" }).length);
});
