import assert from "node:assert/strict";
import test from "node:test";
import {
  missingRequiredResponseKeys,
  type ProgramDefinition,
  programDefinitionSchema,
  responsesMatchDefinition,
  scoreProgram,
} from "./definition";

const definition: ProgramDefinition = {
  schemaVersion: 1,
  locale: "mn",
  title: "Туршилтын хөтөлбөр",
  summary: "Туршилтын тайлбар",
  icon: "🎓",
  sections: [
    {
      id: "assessment",
      type: "ASSESSMENT",
      title: "Үнэлгээ",
      skippable: false,
      questions: [
        {
          id: "mood",
          type: "SINGLE_CHOICE",
          prompt: "Таны сэтгэл ямар байна?",
          required: true,
          options: [
            { id: "low", label: "Бага", score: 0 },
            { id: "high", label: "Өндөр", score: 2 },
          ],
        },
        {
          id: "energy",
          type: "SCALE",
          prompt: "Энерги",
          required: true,
          options: [],
          min: 0,
          max: 10,
          step: 1,
        },
      ],
      tasks: [],
      repeatDays: 1,
      resultBands: [],
    },
    {
      id: "result",
      type: "RESULT",
      title: "Үр дүн",
      skippable: false,
      questions: [],
      tasks: [],
      repeatDays: 1,
      resultBands: [
        {
          id: "steady",
          minPercent: 50,
          maxPercent: 100,
          title: "Тогтвортой",
          body: "Сайн байна.",
        },
      ],
    },
  ],
};

test("validates a versioned program definition", () => {
  assert.equal(programDefinitionSchema.safeParse(definition).success, true);
});

test("scores authored choice and scale questions", () => {
  const score = scoreProgram(definition, {
    "assessment.mood": "high",
    "assessment.energy": 8,
  });
  assert.deepEqual(
    { earned: score.earned, maximum: score.maximum, percent: score.percent },
    { earned: 10, maximum: 12, percent: 83 }
  );
  assert.equal(score.band?.id, "steady");
});

test("finds missing required answers and rejects unknown keys", () => {
  assert.deepEqual(missingRequiredResponseKeys(definition, {}), [
    "assessment.mood",
    "assessment.energy",
  ]);
  assert.equal(
    responsesMatchDefinition(definition, { "assessment.mood": "high" }),
    true
  );
  assert.equal(
    responsesMatchDefinition(definition, { "assessment.unknown": "value" }),
    false
  );
});
