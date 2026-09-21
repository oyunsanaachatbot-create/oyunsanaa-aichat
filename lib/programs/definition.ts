import { z } from "zod";
import { inferTaxonomyFromText, type TaxonomyAssignment } from "../taxonomy";
import { taxonomyAssignmentSchema } from "../taxonomy/schema";

export const PROGRAM_DEFINITION_SCHEMA_VERSION = 1 as const;
export const programContentTypes = [
  "PROGRAM",
  "TRAINING",
  "EMOTIONAL_EDUCATION",
] as const;

export const programRecommendationTypes = [
  "APP",
  "TEST",
  "TRAINING",
  "PROGRAM",
] as const;

const INTERNAL_RECOMMENDATION_HREF = /^\/(?!\/)/;
const HTTPS_RECOMMENDATION_HREF = /^https:\/\//;

export const programSectionTypes = [
  "CONTENT",
  "ASSESSMENT",
  "REFLECTION",
  "GUIDED_CONVERSATION",
  "JOURNAL",
  "DAILY_TASKS",
  "PROGRESS",
  "RESULT",
  "HELP",
] as const;

export const programQuestionTypes = [
  "TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "SCALE",
  "NUMBER",
  "TRUE_FALSE",
  "MATCHING",
  "ORDERING",
  "SCENARIO",
] as const;

const stableIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_-]*$/);

export const programChoiceOptionSchema = z.object({
  id: stableIdSchema,
  label: z.string().trim().min(1).max(300),
  score: z.number().finite().min(-1000).max(1000).default(0),
  reverseScore: z.number().finite().min(-1000).max(1000).optional(),
  semanticKeys: z.array(stableIdSchema).max(20).optional(),
  nextQuestionId: stableIdSchema.optional(),
  nextSectionId: stableIdSchema.optional(),
  conclusionId: stableIdSchema.optional(),
  isCorrect: z.boolean().optional(),
  explanation: z.string().trim().max(2000).optional(),
});

export const programQuestionSchema = z
  .object({
    id: stableIdSchema,
    type: z.enum(programQuestionTypes),
    prompt: z.string().trim().min(1).max(2000),
    description: z.string().trim().max(4000).optional(),
    required: z.boolean().default(true),
    options: z.array(programChoiceOptionSchema).max(50).default([]),
    min: z.number().finite().min(-100_000).max(100_000).optional(),
    max: z.number().finite().min(-100_000).max(100_000).optional(),
    step: z.number().finite().positive().max(10_000).optional(),
    minLabel: z.string().trim().max(160).optional(),
    maxLabel: z.string().trim().max(160).optional(),
    nextQuestionId: stableIdSchema.optional(),
    nextSectionId: stableIdSchema.optional(),
    conclusionId: stableIdSchema.optional(),
  })
  .superRefine((question, context) => {
    if (
      [
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "TRUE_FALSE",
        "MATCHING",
        "ORDERING",
      ].includes(question.type) &&
      question.options.length < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Сонголттой асуулт дор хаяж хоёр сонголттой байна.",
        path: ["options"],
      });
    }

    if (["SCALE", "NUMBER"].includes(question.type)) {
      if (question.min === undefined || question.max === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Тоон асуултад хамгийн бага болон их утга шаардлагатай.",
          path: ["min"],
        });
      } else if (question.min >= question.max) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Хамгийн их утга нь хамгийн бага утгаас их байна.",
          path: ["max"],
        });
      }
    }
  });

export const programTaskSchema = z.object({
  id: stableIdSchema,
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(4000).optional(),
  required: z.boolean().default(false),
});

export const programVideoSchema = z.object({
  provider: z.literal("BUNNY_STREAM"),
  assetId: stableIdSchema.optional(),
  videoId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300),
  durationSeconds: z.number().int().positive().optional(),
  thumbnailUrl: z.string().url().max(1000).optional(),
  status: z.enum(["PROCESSING", "READY", "FAILED"]),
});

export const programRecommendationSchema = z.object({
  id: stableIdSchema,
  type: z.enum(programRecommendationTypes),
  title: z.string().trim().min(1).max(300),
  note: z.string().trim().min(1).max(1000),
  href: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
      (href) =>
        INTERNAL_RECOMMENDATION_HREF.test(href) ||
        HTTPS_RECOMMENDATION_HREF.test(href),
      "Холбоос / тэмдэгтээр эсвэл https:// гэж эхэлнэ."
    ),
});

export const programResultBandSchema = z
  .object({
    id: stableIdSchema,
    minPercent: z.number().int().min(0).max(100),
    maxPercent: z.number().int().min(0).max(100),
    title: z.string().trim().min(1).max(300),
    body: z.string().trim().max(8000),
    taxonomy: taxonomyAssignmentSchema.optional(),
    // Legacy hand-written guidance can be scoped to the exact result band.
    recommendations: z.array(programRecommendationSchema).max(3).optional(),
  })
  .refine((band) => band.minPercent <= band.maxPercent, {
    message: "Үр дүнгийн доод хувь дээд хувиас их байж болохгүй.",
    path: ["maxPercent"],
  });

export const programSectionSchema = z.object({
  id: stableIdSchema,
  type: z.enum(programSectionTypes),
  title: z.string().trim().min(1).max(500),
  subtitle: z.string().trim().max(1000).optional(),
  body: z.string().trim().max(20_000).optional(),
  video: programVideoSchema.optional(),
  skippable: z.boolean().default(false),
  questions: z.array(programQuestionSchema).max(100).default([]),
  tasks: z.array(programTaskSchema).max(100).default([]),
  repeatDays: z.number().int().min(1).max(365).default(1),
  resultBands: z.array(programResultBandSchema).max(20).default([]),
  recommendations: z.array(programRecommendationSchema).max(3).default([]),
  assessment: z.lazy(() => emotionalAssessmentSchema).optional(),
});

export const assessmentMethods = [
  "SCORE",
  "PROFILE",
  "PATTERN",
  "TRACK",
  "DIRECT",
  "CONTEXT",
] as const;

export const assessmentResultModes = ["SINGLE", "MULTIPLE"] as const;
export const assessmentBlockTypes = ["FIELD", "SUBFIELD", "SECTION"] as const;

const assessmentConclusionSchema = z.object({
  id: stableIdSchema,
  title: z.string().trim().max(300),
  body: z.string().trim().max(8000),
  rule: z.string().trim().max(4000).default(""),
  match: z
    .object({
      kind: z.enum([
        "SCORE_RANGE",
        "ASPECT",
        "PATTERN",
        "CHANGE",
        "KNOWLEDGE_RANGE",
        "ANSWER",
        "TERMINAL",
      ]),
      referenceId: stableIdSchema.optional(),
      min: z.number().finite().min(-100_000).max(100_000).optional(),
      max: z.number().finite().min(-100_000).max(100_000).optional(),
      direction: z.enum(["IMPROVED", "UNCHANGED", "DECLINED"]).optional(),
    })
    .optional(),
  taxonomy: taxonomyAssignmentSchema.optional(),
  recommendations: z.array(programRecommendationSchema).max(10).default([]),
});

const assessmentAspectSchema = z.object({
  id: stableIdSchema,
  label: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  questionIds: z.array(stableIdSchema).max(100).default([]),
  taxonomy: taxonomyAssignmentSchema.optional(),
});

const assessmentPatternSchema = z.object({
  id: stableIdSchema,
  label: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  matchMode: z.enum(["ALL", "ANY", "MINIMUM"]).default("MINIMUM"),
  minimumMatches: z.number().int().min(1).max(100).default(1),
  requiredOptionIds: z.array(stableIdSchema).max(200).default([]),
  excludedOptionIds: z.array(stableIdSchema).max(200).default([]),
  taxonomy: taxonomyAssignmentSchema.optional(),
});

const assessmentMetricSchema = z.object({
  id: stableIdSchema,
  label: z.string().trim().min(1).max(300),
  comparisonType: z.enum([
    "NUMBER",
    "SELECTION",
    "LEVEL",
    "INDICATOR",
    "PATTERN",
  ]),
  direction: z.enum(["HIGHER_IS_POSITIVE", "LOWER_IS_POSITIVE", "NEUTRAL"]),
  threshold: z.number().finite().min(0).max(100_000).optional(),
  questionId: stableIdSchema.optional(),
});

const assessmentContextSchema = z.object({
  id: stableIdSchema,
  label: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  influence: z.enum(["BARRIER", "SUPPORT", "MIXED", "UNCLEAR"]),
  questionIds: z.array(stableIdSchema).max(100).default([]),
  taxonomy: taxonomyAssignmentSchema.optional(),
});

const emotionalAssessmentSchema = z.object({
  method: z.enum(assessmentMethods),
  blockType: z.enum(assessmentBlockTypes).default("FIELD"),
  parentSectionId: stableIdSchema.optional(),
  purpose: z.string().trim().max(2000).default(""),
  timeRange: z.string().trim().max(500).optional(),
  resultMode: z.enum(assessmentResultModes).default("SINGLE"),
  minimumAnswers: z.number().int().min(1).max(1000).default(1),
  scoreCalculation: z.enum(["SUM", "AVERAGE", "SUBSCORE", "CUSTOM"]).optional(),
  profileSelection: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  aspects: z.array(assessmentAspectSchema).max(100).default([]),
  patterns: z.array(assessmentPatternSchema).max(100).default([]),
  metrics: z.array(assessmentMetricSchema).max(100).default([]),
  trackAgainst: z.enum(["PREVIOUS", "BASELINE"]).optional(),
  repeatDays: z.number().int().min(1).max(3650).optional(),
  knowledgeDimension: z
    .enum(["KNOWLEDGE", "UNDERSTANDING", "APPLICATION", "SKILL"])
    .optional(),
  allowPartialCredit: z.boolean().optional(),
  contexts: z.array(assessmentContextSchema).max(100).default([]),
  conclusions: z.array(assessmentConclusionSchema).max(100).default([]),
  insufficientDataMessage: z.string().trim().max(2000).optional(),
  entryQuestionId: stableIdSchema.optional(),
});

export const programDefinitionSchema = z
  .object({
    schemaVersion: z.literal(PROGRAM_DEFINITION_SCHEMA_VERSION),
    contentType: z.enum(programContentTypes).default("PROGRAM"),
    locale: z.enum(["mn", "en", "ru", "ja", "ko"]).default("mn"),
    title: z.string().trim().min(1).max(240),
    summary: z.string().trim().min(1).max(1000),
    icon: z.string().trim().min(1).max(16).default("🎓"),
    estimatedMinutes: z.number().int().min(1).max(10_000).optional(),
    disclaimer: z.string().trim().max(4000).optional(),
    taxonomy: taxonomyAssignmentSchema.optional(),
    sections: z.array(programSectionSchema).min(1).max(50),
  })
  .superRefine((definition, context) => {
    const sectionIds = definition.sections.map((section) => section.id);
    if (new Set(sectionIds).size !== sectionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Хэсгийн ID давхардсан байна.",
        path: ["sections"],
      });
    }

    for (const [sectionIndex, section] of definition.sections.entries()) {
      const questionIds = section.questions.map((question) => question.id);
      if (new Set(questionIds).size !== questionIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Нэг хэсэг доторх асуултын ID давхардсан байна.",
          path: ["sections", sectionIndex, "questions"],
        });
      }
      const taskIds = section.tasks.map((task) => task.id);
      if (new Set(taskIds).size !== taskIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Нэг хэсэг доторх даалгаврын ID давхардсан байна.",
          path: ["sections", sectionIndex, "tasks"],
        });
      }
      if (
        new Set([...questionIds, ...taskIds]).size !==
        questionIds.length + taskIds.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Асуулт болон даалгаврын ID хоорондоо давхцаж болохгүй.",
          path: ["sections", sectionIndex],
        });
      }
    }
  });

export type ProgramDefinition = z.infer<typeof programDefinitionSchema>;
export type ProgramSection = z.infer<typeof programSectionSchema>;
export type ProgramResultBand = z.infer<typeof programResultBandSchema>;
export type ProgramQuestion = z.infer<typeof programQuestionSchema>;
export type ProgramVideo = z.infer<typeof programVideoSchema>;
export type ProgramRecommendation = z.infer<typeof programRecommendationSchema>;
export type AssessmentConclusion = z.infer<typeof assessmentConclusionSchema>;
export type ProgramAnswer = string | number | string[] | boolean;
export type ProgramResponses = Record<string, ProgramAnswer>;

/** Resolves legacy result bands that were saved before per-band taxonomy existed. */
export function resolveResultTaxonomy(
  band: ProgramResultBand | null | undefined,
  fallback: TaxonomyAssignment | undefined
) {
  if (band?.taxonomy) return band.taxonomy;
  if (band) {
    const inferred = inferTaxonomyFromText(`${band.title}\n${band.body}`);
    if (inferred) return inferred;
  }
  return fallback;
}

export type ProgramScore = {
  earned: number;
  maximum: number;
  percent: number;
  band: z.infer<typeof programResultBandSchema> | null;
};

function numericAnswer(value: ProgramAnswer | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export function scoreProgram(
  definition: ProgramDefinition,
  responses: ProgramResponses
): ProgramScore {
  let earned = 0;
  let maximum = 0;
  const sections = isEmotionalAssessmentDefinition(definition)
    ? getReachableAssessmentSections(definition, responses)
    : definition.sections;

  for (const section of sections) {
    for (const question of section.questions) {
      const answer = responses[`${section.id}.${question.id}`];
      if (question.type === "SINGLE_CHOICE") {
        const best = Math.max(
          0,
          ...question.options.map((option) => option.score)
        );
        maximum += best;
        earned +=
          question.options.find((option) => option.id === answer)?.score ?? 0;
      } else if (question.type === "MULTIPLE_CHOICE") {
        const selected = Array.isArray(answer)
          ? new Set(answer)
          : new Set<string>();
        maximum += question.options.reduce(
          (total, option) => total + Math.max(0, option.score),
          0
        );
        earned += question.options.reduce(
          (total, option) =>
            total + (selected.has(option.id) ? option.score : 0),
          0
        );
      } else if (question.type === "SCALE") {
        const min = question.min ?? 0;
        const max = question.max ?? 10;
        const value = numericAnswer(answer);
        maximum += max - min;
        if (value !== null) earned += Math.max(0, Math.min(max, value) - min);
      }
    }
  }

  const normalizedEarned = Math.max(0, earned);
  const percent =
    maximum > 0 ? Math.round((normalizedEarned / maximum) * 100) : 0;
  const resultSection = definition.sections.find(
    (section) => section.type === "RESULT"
  );
  const band =
    resultSection?.resultBands.find(
      (candidate) =>
        percent >= candidate.minPercent && percent <= candidate.maxPercent
    ) ?? null;

  return { earned: normalizedEarned, maximum, percent, band };
}

export function responseKey(sectionId: string, itemId: string) {
  return `${sectionId}.${itemId}`;
}

export function taskResponseKey(
  sectionId: string,
  taskId: string,
  day: number
) {
  return `${sectionId}.${taskId}.day-${day}`;
}

export function isEmotionalAssessmentDefinition(definition: ProgramDefinition) {
  return (
    definition.contentType === "EMOTIONAL_EDUCATION" &&
    definition.sections.some(
      (section) => section.type === "ASSESSMENT" && section.assessment
    )
  );
}

function selectedOptionIds(value: ProgramAnswer | undefined) {
  return new Set(
    Array.isArray(value) ? value : typeof value === "string" ? [value] : []
  );
}

/** Returns only the assessment blocks reachable through the authored branches. */
export function getReachableAssessmentSections(
  definition: ProgramDefinition,
  responses: ProgramResponses
) {
  const sections = definition.sections.filter(
    (section) => section.type === "ASSESSMENT" && section.assessment
  );
  if (!sections.length) return [];

  const byId = new Map(sections.map((section) => [section.id, section]));
  const roots = sections.filter(
    (section) =>
      !section.assessment?.parentSectionId &&
      section.assessment?.blockType === "FIELD"
  );
  const queue = [...(roots.length ? roots : [sections[0]])];
  const visited = new Set<string>();

  while (queue.length) {
    const section = queue.shift();
    if (!section || visited.has(section.id)) continue;
    visited.add(section.id);

    for (const question of section.questions) {
      const answer = responses[responseKey(section.id, question.id)];
      const chosen = selectedOptionIds(answer);
      const selectedOptions = question.options.filter((option) =>
        chosen.has(option.id)
      );
      const nextSectionIds = new Set<string>();
      for (const option of selectedOptions) {
        if (option.nextSectionId) nextSectionIds.add(option.nextSectionId);
      }
      if (question.nextSectionId) nextSectionIds.add(question.nextSectionId);
      for (const nextSectionId of nextSectionIds) {
        const next = byId.get(nextSectionId);
        if (next && !visited.has(next.id)) queue.push(next);
      }
    }
  }

  return sections.filter((section) => visited.has(section.id));
}

function numericQuestionAnswer(
  question: ProgramQuestion,
  answer: ProgramAnswer | undefined
) {
  if (typeof answer === "number") return answer;
  const selected = selectedOptionIds(answer);
  return question.options
    .filter((option) => selected.has(option.id))
    .reduce((sum, option) => sum + (option.score ?? 0), 0);
}

function matchesAssessmentConclusion(
  conclusion: AssessmentConclusion,
  section: ProgramSection,
  responses: ProgramResponses
) {
  const match = conclusion.match;
  if (!match || match.kind === "TERMINAL") return true;
  const chosen = new Set(
    section.questions.flatMap((question) => [
      ...selectedOptionIds(responses[responseKey(section.id, question.id)]),
    ])
  );
  if (match.kind === "ANSWER") {
    return Boolean(match.referenceId && chosen.has(match.referenceId));
  }
  if (match.kind === "ASPECT") {
    const aspect = section.assessment?.aspects.find(
      (item) => item.id === match.referenceId
    );
    return Boolean(
      aspect?.questionIds.some((id) =>
        hasAnswer(responses[responseKey(section.id, id)])
      )
    );
  }
  if (match.kind === "PATTERN") {
    const pattern = section.assessment?.patterns.find(
      (item) => item.id === match.referenceId
    );
    if (!pattern) return false;
    const count = pattern.requiredOptionIds.filter((id) =>
      chosen.has(id)
    ).length;
    if (pattern.excludedOptionIds.some((id) => chosen.has(id))) return false;
    if (pattern.matchMode === "ALL")
      return count === pattern.requiredOptionIds.length;
    if (pattern.matchMode === "ANY") return count > 0;
    return count >= pattern.minimumMatches;
  }
  const total = section.questions.reduce(
    (sum, question) =>
      sum +
      numericQuestionAnswer(
        question,
        responses[responseKey(section.id, question.id)]
      ),
    0
  );
  if (match.kind === "SCORE_RANGE" || match.kind === "KNOWLEDGE_RANGE") {
    return (
      (match.min === undefined || total >= match.min) &&
      (match.max === undefined || total <= match.max)
    );
  }
  return false;
}

export type AssessmentResult = {
  id: string;
  title: string;
  body: string;
  taxonomy?: TaxonomyAssignment;
  recommendations: z.infer<typeof programRecommendationSchema>[];
};

export function getAssessmentResults(
  definition: ProgramDefinition,
  responses: ProgramResponses
): AssessmentResult[] {
  const results: AssessmentResult[] = [];
  for (const section of getReachableAssessmentSections(definition, responses)) {
    const assessment = section.assessment;
    if (!assessment) continue;
    const matched = assessment.conclusions.filter((conclusion) =>
      matchesAssessmentConclusion(conclusion, section, responses)
    );
    const selected =
      assessment.resultMode === "SINGLE" ? matched.slice(0, 1) : matched;
    for (const conclusion of selected) {
      if (results.some((result) => result.id === conclusion.id)) continue;
      results.push({
        id: conclusion.id,
        title: conclusion.title,
        body: conclusion.body,
        taxonomy: conclusion.taxonomy,
        recommendations: conclusion.recommendations,
      });
    }
  }
  return results;
}

function hasAnswer(value: ProgramAnswer | undefined) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined;
}

export function missingRequiredResponseKeys(
  definition: ProgramDefinition,
  responses: ProgramResponses
) {
  const missing: string[] = [];
  const sections = isEmotionalAssessmentDefinition(definition)
    ? getReachableAssessmentSections(definition, responses)
    : definition.sections;
  for (const section of sections) {
    if (section.skippable) continue;
    for (const question of section.questions) {
      const key = responseKey(section.id, question.id);
      if (question.required && !hasAnswer(responses[key])) missing.push(key);
    }
    for (const task of section.tasks) {
      if (!task.required) continue;
      for (let day = 1; day <= section.repeatDays; day += 1) {
        const key = taskResponseKey(section.id, task.id, day);
        if (responses[key] !== true) missing.push(key);
      }
    }
  }
  return missing;
}

export function responsesMatchDefinition(
  definition: ProgramDefinition,
  responses: ProgramResponses
) {
  if (Object.keys(responses).length > 2000) return false;
  const allowed = new Map<string, ProgramQuestion | "TASK">();
  for (const section of definition.sections) {
    for (const question of section.questions) {
      allowed.set(responseKey(section.id, question.id), question);
    }
    for (const task of section.tasks) {
      for (let day = 1; day <= section.repeatDays; day += 1) {
        allowed.set(taskResponseKey(section.id, task.id, day), "TASK");
      }
    }
  }

  for (const [key, value] of Object.entries(responses)) {
    const item = allowed.get(key);
    if (!item) return false;
    if (item === "TASK") {
      if (typeof value !== "boolean") return false;
      continue;
    }
    if (item.type === "TEXT") {
      if (typeof value !== "string" || value.length > 10_000) return false;
    } else if (["NUMBER", "SCALE"].includes(item.type)) {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      if (item.min !== undefined && value < item.min) return false;
      if (item.max !== undefined && value > item.max) return false;
    } else if (item.type === "SINGLE_CHOICE") {
      if (
        typeof value !== "string" ||
        !item.options.some((option) => option.id === value)
      ) {
        return false;
      }
    } else if (
      ["MULTIPLE_CHOICE", "MATCHING", "ORDERING"].includes(item.type) &&
      (!Array.isArray(value) ||
        value.length > item.options.length ||
        value.some(
          (selected) =>
            typeof selected !== "string" ||
            !item.options.some((option) => option.id === selected)
        ))
    ) {
      return false;
    } else if (item.type === "TRUE_FALSE") {
      if (typeof value !== "boolean") return false;
    } else if (
      item.type === "SCENARIO" &&
      (typeof value !== "string" || value.length > 10_000)
    )
      return false;
  }
  return true;
}
