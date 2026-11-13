import assert from "node:assert/strict";
import test from "node:test";
import { resolveAppAccess } from "../subscription/app-access";
import {
  programDefinitionSchema,
  programQuestionSchema,
  missingRequiredResponseKeys,
  responsesMatchDefinition,
  scoreProgram,
} from "./definition";
import {
  isQuestionAnswered,
  programCompletionPercent,
} from "./question-interactions";

const options = [
  { id: "a", label: "Нэг", score: 1, matchLabel: "First" },
  { id: "b", label: "Хоёр", score: 1, matchLabel: "Second" },
];
function definition(
  type: "MATCHING" | "ORDERING" | "MULTIPLE_CHOICE",
  version?: 2
) {
  return programDefinitionSchema.parse({
    schemaVersion: 1,
    contentType: "TRAINING",
    locale: "mn",
    title: "QA",
    summary: "QA",
    icon: "x",
    sections: [
      {
        id: "lesson",
        type: "CONTENT",
        title: "QA",
        questions: [
          { id: "q", type, interactionVersion: version, prompt: "QA", options },
        ],
        tasks: [{ id: "practice", title: "QA", required: true }],
        repeatDays: 2,
      },
    ],
  });
}
test("R10: active company and admin shell access survive personal expiry without granting personal paid access", () => {
  for (const personalHasAccess of [false, true])
    for (const admin of [false, true])
      for (const organizationActive of [false, true]) {
        const access = resolveAppAccess({
          personalHasAccess,
          admin,
          organizationActive,
        });
        assert.equal(
          access.canAccessApp,
          personalHasAccess || admin || organizationActive
        );
        assert.equal("hasAccess" in access, false);
      }
  assert.equal(
    resolveAppAccess({
      personalHasAccess: false,
      admin: false,
      organizationActive: false,
    }).accessSource,
    "none"
  );
  assert.equal(
    resolveAppAccess({
      personalHasAccess: false,
      admin: false,
      organizationActive: true,
    }).accessSource,
    "organization"
  );
});
test("R05/R09: paired matching validates a one-to-one mapping and preserves draft versus complete", () => {
  const d = definition("MATCHING", 2);
  const complete = {
    "lesson.q": ["a=a", "b=b"],
    "lesson.practice.day-1": true,
    "lesson.practice.day-2": true,
  };
  assert.equal(responsesMatchDefinition(d, { "lesson.q": ["a=b"] }), true);
  assert.ok(
    missingRequiredResponseKeys(d, { "lesson.q": ["a=b"] }).includes("lesson.q")
  );
  for (const bad of [["a=a", "b=a"], ["a=a", "a=b"], ["a=x"], ["a"], ["a=a=x"]])
    assert.equal(responsesMatchDefinition(d, { "lesson.q": bad }), false);
  assert.deepEqual(missingRequiredResponseKeys(d, complete), []);
  assert.equal(scoreProgram(d, complete).earned, 2);
  assert.equal(scoreProgram(d, { "lesson.q": ["a=b", "b=a"] }).earned, 0);
});
test("R05: new ordering scores position; legacy ordering keeps its published interpretation", () => {
  const d = definition("ORDERING", 2);
  assert.equal(scoreProgram(d, { "lesson.q": ["a", "b"] }).earned, 2);
  assert.equal(scoreProgram(d, { "lesson.q": ["b", "a"] }).earned, 0);
  assert.equal(
    scoreProgram(definition("ORDERING"), { "lesson.q": ["b", "a"] }).earned,
    2
  );
  assert.equal(isQuestionAnswered(d.sections[0].questions[0], ["a"]), false);
  assert.equal(
    isQuestionAnswered(d.sections[0].questions[0], ["b", "a"]),
    true
  );
});
test("R09: repeated or unknown selection IDs are refused for all array choice variants", () => {
  for (const type of ["MATCHING", "ORDERING", "MULTIPLE_CHOICE"] as const) {
    const d = definition(type);
    assert.equal(
      responsesMatchDefinition(d, { "lesson.q": ["a", "a"] }),
      false
    );
    assert.equal(
      responsesMatchDefinition(d, { "lesson.q": ["a", "unknown"] }),
      false
    );
    assert.equal(responsesMatchDefinition(d, { "lesson.q": ["a", "b"] }), true);
  }
  assert.equal(
    responsesMatchDefinition(definition("MATCHING"), { "lesson.q": "a" }),
    true
  );
});
test("R05: v2 requires right-hand labels while legacy definitions remain readable", () => {
  const input = {
    id: "q",
    type: "MATCHING",
    prompt: "QA",
    options: options.map(({ matchLabel, ...option }) => option),
  };
  assert.equal(programQuestionSchema.safeParse(input).success, true);
  assert.equal(
    programQuestionSchema.safeParse({ ...input, interactionVersion: 2 })
      .success,
    false
  );
  assert.equal(
    programQuestionSchema.safeParse({
      ...input,
      options: [options[0], options[0]],
    }).success,
    false
  );
});
test("R07/R08: zero is answered; a new lesson starts at zero and only confirmed completion reaches 100", () => {
  const d = definition("MULTIPLE_CHOICE");
  const q = d.sections[0].questions[0];
  assert.equal(isQuestionAnswered(q, undefined), false);
  assert.equal(isQuestionAnswered({ ...q, type: "SCALE" }, 0), true);
  assert.equal(programCompletionPercent(d, {}, false), 0);
  assert.equal(programCompletionPercent(d, { "lesson.q": ["a"] }, false), 33);
  const full = {
    "lesson.q": ["a"],
    "lesson.practice.day-1": true,
    "lesson.practice.day-2": true,
  };
  assert.equal(programCompletionPercent(d, full, false), 99);
  assert.equal(programCompletionPercent(d, full, true), 100);
});
