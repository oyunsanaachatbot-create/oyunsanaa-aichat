import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAssessmentHistory,
  evaluateAssessmentResults,
  missingRequiredResponseKeys,
  programDefinitionSchema,
  scoreProgram,
} from "./definition";

function assessment(
  method: "SCORE" | "DIRECT" | "PATTERN" | "PROFILE" | "TRACK",
  overrides: Record<string, unknown> = {}
) {
  return programDefinitionSchema.parse({
    schemaVersion: 1,
    contentType: "EMOTIONAL_EDUCATION",
    locale: "mn",
    title: "Үр дүнгийн шалгалт",
    summary: "Тайлбар",
    icon: "🧠",
    sections: [
      {
        id: "root",
        type: "ASSESSMENT",
        title: "Үнэлгээ",
        questions: [
          {
            id: "a",
            type: "SINGLE_CHOICE",
            prompt: "А",
            required: true,
            options: [
              { id: "low", label: "Бага", score: 1, isCorrect: false },
              { id: "high", label: "Өндөр", score: 3, isCorrect: true },
            ],
          },
          {
            id: "b",
            type: "SINGLE_CHOICE",
            prompt: "Б",
            required: true,
            options: [
              { id: "no", label: "Үгүй", score: 1, isCorrect: false },
              { id: "yes", label: "Тийм", score: 3, isCorrect: true },
            ],
          },
        ],
        tasks: [],
        repeatDays: 1,
        resultBands: [],
        recommendations: [],
        assessment: { method, blockType: "FIELD", ...overrides },
      },
    ],
  });
}

test("SCORE average uses the authored average and minimum answer rule", () => {
  const definition = assessment("SCORE", {
    scoreCalculation: "AVERAGE",
    minimumAnswers: 2,
    conclusions: [
      {
        id: "mid",
        title: "Дундаж",
        body: "Тайлбар",
        match: { kind: "SCORE_RANGE", min: 2, max: 2 },
      },
    ],
  });
  assert.deepEqual(
    evaluateAssessmentResults(definition, { "root.a": "low" }).results,
    []
  );
  const evaluation = evaluateAssessmentResults(definition, {
    "root.a": "low",
    "root.b": "yes",
  });
  assert.equal(evaluation.results[0]?.id, "mid");
  assert.equal(evaluation.results[0]?.value, 2);
});

test("an answer conclusion ends its branch before later required questions", () => {
  const definition = assessment("SCORE", {
    conclusions: [{ id: "direct", title: "Шууд", body: "Дүгнэлт" }],
  });
  definition.sections[0].questions[0].options[0].conclusionId = "direct";
  const responses = { "root.a": "low" };
  assert.deepEqual(missingRequiredResponseKeys(definition, responses), []);
  assert.deepEqual(evaluateAssessmentResults(definition, responses).results.map((result) => result.id), ["direct"]);
});

test("question default conclusion applies when the selected option has no route", () => {
  const definition = assessment("SCORE", {
    conclusions: [{ id: "default", title: "Үндсэн", body: "Дүгнэлт" }],
  });
  definition.sections[0].questions[0].conclusionId = "default";
  const responses = { "root.a": "low" };
  assert.deepEqual(missingRequiredResponseKeys(definition, responses), []);
  assert.deepEqual(evaluateAssessmentResults(definition, responses).results.map((result) => result.id), ["default"]);
});

test("DIRECT uses percent correct while PATTERN uses terminal only as fallback", () => {
  const direct = assessment("DIRECT", {
    conclusions: [
      {
        id: "half",
        title: "Хагас",
        body: "",
        match: { kind: "KNOWLEDGE_RANGE", min: 50, max: 50 },
      },
    ],
  });
  const result = evaluateAssessmentResults(direct, {
    "root.a": "high",
    "root.b": "no",
  }).results[0];
  assert.equal(result?.id, "half");
  assert.equal(result?.value, 50);

  const pattern = assessment("PATTERN", {
    patterns: [
      {
        id: "p",
        label: "Хэв маяг",
        requiredOptionIds: ["high"],
        matchMode: "ANY",
      },
    ],
    conclusions: [
      {
        id: "match",
        title: "Тохирсон",
        body: "",
        match: { kind: "PATTERN", referenceId: "p" },
      },
      { id: "fallback", title: "Бусад", body: "", match: { kind: "TERMINAL" } },
    ],
  });
  assert.equal(
    evaluateAssessmentResults(pattern, { "root.a": "high" }).results[0]?.id,
    "match"
  );
  assert.equal(
    evaluateAssessmentResults(pattern, { "root.a": "low" }).results[0]?.id,
    "fallback"
  );
});

test("PROFILE ranks aspect averages and TRACK compares the prior completed run", () => {
  const profile = assessment("PROFILE", {
    profileSelection: "SINGLE",
    aspects: [
      { id: "first", label: "Эхний", questionIds: ["a"] },
      { id: "second", label: "Дараагийн", questionIds: ["b"] },
    ],
    conclusions: [
      {
        id: "first-result",
        title: "Эхний",
        body: "",
        match: { kind: "ASPECT", referenceId: "first" },
      },
      {
        id: "second-result",
        title: "Дараагийн",
        body: "",
        match: { kind: "ASPECT", referenceId: "second" },
      },
    ],
  });
  assert.equal(
    evaluateAssessmentResults(profile, { "root.a": "low", "root.b": "yes" })
      .results[0]?.id,
    "second-result"
  );

  const track = assessment("TRACK", {
    metrics: [
      {
        id: "metric",
        label: "Өөрчлөлт",
        comparisonType: "SELECTION",
        direction: "HIGHER_IS_POSITIVE",
        questionId: "a",
      },
    ],
    conclusions: [
      {
        id: "improved",
        title: "Сайжирсан",
        body: "",
        match: { kind: "CHANGE", direction: "IMPROVED" },
      },
    ],
  });
  assert.equal(
    evaluateAssessmentResults(track, { "root.a": "high" }).results.length,
    0
  );
  const history = buildAssessmentHistory(track, [{ "root.a": "low" }]);
  assert.equal(
    evaluateAssessmentResults(track, { "root.a": "high" }, history).results[0]
      ?.id,
    "improved"
  );
});

test("a generic program with no scored questions does not invent a zero-percent result band", () => {
  const generic = programDefinitionSchema.parse({
    schemaVersion: 1,
    contentType: "PROGRAM",
    locale: "mn",
    title: "Тест",
    summary: "Тайлбар",
    icon: "🎓",
    sections: [
      {
        id: "question",
        type: "ASSESSMENT",
        title: "Асуулт",
        questions: [
          { id: "text", type: "TEXT", prompt: "Сэтгэгдэл", options: [] },
        ],
      },
      {
        id: "result",
        type: "RESULT",
        title: "Үр дүн",
        resultBands: [
          { id: "zero", minPercent: 0, maxPercent: 0, title: "Тэг", body: "" },
        ],
      },
    ],
  });
  assert.equal(
    scoreProgram(generic, { "question.text": "Хариулт" }).band,
    null
  );
});
