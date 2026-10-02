import assert from "node:assert/strict";
import test from "node:test";
import { validateEmployeeValue } from "./response-validation";

test("personal direction answers require an authored choice", () => {
  const payload = {
    title: "Хувийн асуулт",
    responseType: "NONE" as const,
    options: [],
    answerDirections: [{ label: "A", directionId: "one" }, { label: "B", directionId: "two" }],
  };
  assert.equal(validateEmployeeValue("PERSONAL_QUESTION", payload, "A"), true);
  assert.equal(validateEmployeeValue("PERSONAL_QUESTION", payload, "C"), false);
  assert.equal(validateEmployeeValue("SUPERLATIVE_PACK", { title: "Сонголт", options: ["A", "B"] }, "B"), true);
});

test("survey requires each answer and an assessment cannot be submitted as a simple block", () => {
  const payload = {
    title: "Судалгаа",
    questions: [
      { id: "choice", prompt: "Сонгох", responseType: "SINGLE_CHOICE" as const, options: ["A", "B"] },
      { id: "scale", prompt: "Оноо", responseType: "SCALE_1_5" as const },
    ],
  };
  assert.equal(validateEmployeeValue("SURVEY", payload, { choice: "A", scale: 3 }), true);
  assert.equal(validateEmployeeValue("SURVEY", payload, { choice: "A", scale: 6 }), false);
  assert.equal(validateEmployeeValue("ASSESSMENT", { title: "Үнэлгээ", assessmentProgramVersionId: "version" }, true), false);
});

test("suggestion selection is distinct from manager confirmation", () => {
  const payload = { title: "Санал", options: ["A", "B"] };
  assert.equal(validateEmployeeValue("SUGGESTION", payload, { selected: ["A"] }), true);
  assert.equal(validateEmployeeValue("SUGGESTION", payload, { selected: ["C"] }), false);
  assert.equal(validateEmployeeValue("FEEDBACK", payload, true), false);
  assert.equal(validateEmployeeValue("IMPLEMENTATION", payload, true), false);
});
