import assert from "node:assert/strict";
import test from "node:test";
import {
  getAssessmentResults,
  getAssessmentProfileSummaries,
  getReachableAssessmentSections,
  isEmotionalAssessmentDefinition,
  missingRequiredResponseKeys,
  type ProgramDefinition,
  programDefinitionSchema,
  responsesMatchDefinition,
  scoreProgram,
} from "./definition";

const definition: ProgramDefinition = {
  schemaVersion: 1,
  contentType: "PROGRAM",
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
      recommendations: [],
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
      recommendations: [],
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

test("accepts new emotional assessment blocks and follows authored branches", () => {
  const emotionalEducation = {
    schemaVersion: 1 as const,
    contentType: "EMOTIONAL_EDUCATION" as const,
    locale: "mn" as const,
    title: "Сэтгэлийн боловсрол",
    summary: "Тестийн тайлбар",
    icon: "🧠",
    sections: [
      {
        id: "root",
        type: "ASSESSMENT" as const,
        title: "Эхлэх",
        questions: [
          {
            id: "area",
            type: "SINGLE_CHOICE" as const,
            prompt: "Юу хамгийн их нөлөөлж байна вэ?",
            required: true,
            options: [
              { id: "health", label: "Эрүүл мэнд", nextSectionId: "health" },
              { id: "finance", label: "Санхүү", nextSectionId: "finance" },
            ],
          },
        ],
        tasks: [],
        repeatDays: 1,
        resultBands: [],
        recommendations: [],
        assessment: {
          method: "CONTEXT" as const,
          blockType: "FIELD" as const,
          conclusions: [],
        },
      },
      {
        id: "health",
        type: "ASSESSMENT" as const,
        title: "Эрүүл мэнд",
        questions: [
          {
            id: "sleep",
            type: "SINGLE_CHOICE" as const,
            prompt: "Та сайн унтаж байна уу?",
            required: true,
            options: [
              { id: "yes", label: "Тийм", score: 3 },
              { id: "no", label: "Үгүй", score: 1 },
            ],
          },
        ],
        tasks: [],
        repeatDays: 1,
        resultBands: [],
        recommendations: [],
        assessment: {
          method: "SCORE" as const,
          blockType: "SECTION" as const,
          parentSectionId: "root",
          conclusions: [
            {
              id: "sleep-result",
              title: "Нойрны асуудал",
              body: "Тайван амраарай",
              match: { kind: "SCORE_RANGE" as const, min: 1, max: 1 },
            },
          ],
        },
      },
      {
        id: "finance",
        type: "ASSESSMENT" as const,
        title: "Санхүү",
        questions: [],
        tasks: [],
        repeatDays: 1,
        resultBands: [],
        recommendations: [],
        assessment: {
          method: "CONTEXT" as const,
          blockType: "SUBFIELD" as const,
          parentSectionId: "root",
          conclusions: [],
        },
      },
    ],
  };

  const parsed = programDefinitionSchema.safeParse(emotionalEducation);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(isEmotionalAssessmentDefinition(parsed.data), true);

  const responses = { "root.area": "health", "health.sleep": "no" } as const;
  assert.deepEqual(
    getReachableAssessmentSections(parsed.data, responses).map(
      (section) => section.id
    ),
    ["root", "health"]
  );
  assert.deepEqual(missingRequiredResponseKeys(parsed.data, responses), []);
  assert.equal(
    getAssessmentResults(parsed.data, responses)[0]?.title,
    "Нойрны асуудал"
  );
});

test("returns the conclusion explicitly linked to the selected answer", () => {
  const emotionalEducation = programDefinitionSchema.parse({
    schemaVersion: 1,
    contentType: "EMOTIONAL_EDUCATION",
    locale: "mn",
    title: "Үр дүнгийн зам",
    summary: "Сонголтоор дүгнэлт үзүүлнэ.",
    icon: "🧠",
    sections: [
      {
        id: "root",
        type: "ASSESSMENT",
        title: "Талбар",
        questions: [
          {
            id: "choice",
            type: "SINGLE_CHOICE",
            prompt: "Аль нь вэ?",
            required: true,
            options: [
              {
                id: "selected",
                label: "Сонгосон",
                conclusionId: "selected-result",
              },
              { id: "other", label: "Сонгоогүй", conclusionId: "other-result" },
            ],
          },
        ],
        assessment: {
          method: "CONTEXT",
          blockType: "FIELD",
          conclusions: [
            {
              id: "selected-result",
              title: "Сонгосон үр дүн",
              body: "Энэ үр дүнг хариултаар шууд сонгосон.",
              match: { kind: "SCORE_RANGE", min: 10, max: 10 },
            },
            {
              id: "other-result",
              title: "Бусад үр дүн",
              body: "Энэ үр дүнг сонгоогүй.",
            },
          ],
        },
      },
    ],
  });

  assert.deepEqual(
    getAssessmentResults(emotionalEducation, { "root.choice": "selected" }).map(
      ({ title }) => title
    ),
    ["Сонгосон үр дүн"]
  );
});

test("profile selects exactly one ranged conclusion for each of five three-question aspects", () => {
  const aspects = Array.from({ length: 5 }, (_, index) => ({
    id: `aspect-${index}`,
    label: `Тал ${index + 1}`,
    questionIds: Array.from({ length: 3 }, (_unused, question) => `q-${index}-${question}`),
  }));
  const profile = programDefinitionSchema.parse({
    ...definition,
    contentType: "EMOTIONAL_EDUCATION",
    sections: [{
      id: "profile",
      type: "ASSESSMENT",
      title: "Одоогийн байдлын зураг",
      questions: aspects.flatMap((aspect) => aspect.questionIds.map((id) => ({
        id, type: "SCALE", prompt: id, required: true, min: 1, max: 5,
      }))),
      assessment: {
        method: "PROFILE", profileSelection: "MULTIPLE", resultMode: "SINGLE",
        minimumAnswers: 15, aspects,
        conclusions: aspects.flatMap((aspect) => [
          { id: `${aspect.id}-low`, title: "Бага", body: "Бага дундаж",
            match: { kind: "ASPECT", referenceId: aspect.id, min: 1, max: 2 } },
          { id: `${aspect.id}-high`, title: "Өндөр", body: "Өндөр дундаж",
            match: { kind: "ASPECT", referenceId: aspect.id, min: 2.01, max: 5 } },
        ]),
        profileSummaries: [{ id: "summary", title: "Ерөнхий", body: "Нийт зураг", minAverage: 1, maxAverage: 5 }],
      },
    }],
  });
  const responses = Object.fromEntries(aspects.flatMap((aspect, index) =>
    aspect.questionIds.map((id) => [`profile.${id}`, index + 1])
  ));
  assert.deepEqual(getAssessmentResults(profile, responses).map(({ id }) => id), [
    "aspect-4-high", "aspect-3-high", "aspect-2-high", "aspect-1-low", "aspect-0-low",
  ]);
  assert.deepEqual(getAssessmentResults(profile, responses).map(({ value }) => value), [5, 4, 3, 2, 1]);
  // A group uses its own three answers, not the section total or first answer.
  const mixed = { ...responses, "profile.q-0-0": 1, "profile.q-0-1": 1, "profile.q-0-2": 5 };
  assert.equal(getAssessmentResults(profile, mixed).find(({ id }) => id.startsWith("aspect-0"))?.id, "aspect-0-high");
  assert.equal(getAssessmentResults(profile, {}).length, 0);
  assert.deepEqual(getAssessmentProfileSummaries(profile, responses), [{
    id: "summary", title: "Ерөнхий", body: "Нийт зураг", value: 3,
  }]);
  assert.deepEqual(getAssessmentProfileSummaries(profile, {}), []);
  const single = programDefinitionSchema.parse({
    ...profile,
    sections: [{ ...profile.sections[0], assessment: { ...profile.sections[0].assessment, profileSelection: "SINGLE" } }],
  });
  assert.deepEqual(getAssessmentResults(single, responses).map(({ id }) => id), ["aspect-4-high"]);
});
