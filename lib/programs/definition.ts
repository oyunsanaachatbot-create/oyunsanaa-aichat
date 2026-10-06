import { evaluateProfile } from "./profile-results";
import { z } from "zod";
import { inferTaxonomyFromText, type TaxonomyAssignment } from "../taxonomy";
import { taxonomyAssignmentSchema } from "../taxonomy/schema";
import { evaluateAssessmentSection, type AssessmentAnswer, type TrackSnapshot } from "./assessment-engine";

export const PROGRAM_DEFINITION_SCHEMA_VERSION = 1 as const;
export const programContentTypes = [
  "PROGRAM",
  "TRAINING",
  "EMOTIONAL_EDUCATION",
  "ORGANIZATION_PROGRAM",
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
  title: z.string().trim().max(300),
  durationSeconds: z.number().int().positive().nullish().transform((value) => value ?? undefined).optional(),
  thumbnailUrl: z.string().url().max(1000).nullish().transform((value) => value ?? undefined).optional(),
  status: z.enum(["PROCESSING", "READY", "FAILED"]),
});

export const trainingMaterialSchema = z.object({
  id: stableIdSchema,
  type: z.enum(["IMAGE", "VIDEO"]),
  imageUrl: z.string().trim().max(2000).optional(),
  video: programVideoSchema.optional(),
  script: z.string().trim().max(8000).default(""),
  timingOffsetSeconds: z.number().int().min(-120).max(120).default(0),
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
  audioUrl: z.string().trim().max(2000).optional(),
  materials: z.array(trainingMaterialSchema).max(30).optional(),
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

const assessmentProfileSummarySchema = z
  .object({
    id: stableIdSchema,
    title: z.string().trim().min(1).max(300),
    body: z.string().trim().min(1).max(8000),
    minAverage: z.number().finite().min(-100_000).max(100_000).optional(),
    maxAverage: z.number().finite().min(-100_000).max(100_000).optional(),
  })
  .refine((item) => item.minAverage === undefined || item.maxAverage === undefined || item.minAverage <= item.maxAverage, {
    message: "Ерөнхий дүгнэлтийн доод дундаж дээд дунджаас их байж болохгүй.",
    path: ["maxAverage"],
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
  profileSummaries: z.array(assessmentProfileSummarySchema).max(20).default([]),
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

export const organizationDayBlockTypes = [
  "OYUNSANAA_MESSAGE", "CHECK_IN", "QUESTION", "APPRECIATION", "SURPRISE",
  "MESSAGE", "AUDIO", "QUIZ", "TRAINING", "PROGRAM", "TASK",
] as const;

export const organizationDayBlockSchema = z.object({
  id: stableIdSchema,
  type: z.enum(organizationDayBlockTypes),
  title: z.string().trim().max(500).default(""),
  body: z.string().trim().max(8000).default(""),
  prompt: z.string().trim().max(2000).default(""),
  required: z.boolean().default(false),
  linkedProgramId: z.string().uuid().optional(),
  audioUrl: z.string().trim().max(2000).optional(),
  responseType: z.enum(["NONE", "TEXT", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "SCALE"]).default("NONE"),
  options: z.array(z.string().trim().max(500)).max(20).default([]),
  responseUse: z.enum(["NONE", "PERSONAL", "ANONYMOUS_REPORT", "ASSESSMENT"]).default("NONE"),
  appreciationMode: z.enum(["ASSIGNED_COLLEAGUE", "FREE_CHOICE"]).optional(),
});

export const organizationDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(366),
  blocks: z.array(organizationDayBlockSchema).max(20).default([]),
});

export const organizationProgramConfigSchema = z.object({
  durationMonths: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]).default(3),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  initialAssessmentRootId: stableIdSchema.default("organization-start-assessment"),
  finalAssessmentRootId: stableIdSchema.default("organization-final-assessment"),
  initialAssessmentProgramIds: z.array(z.string().uuid()).max(20).default([]),
  finalAssessmentProgramIds: z.array(z.string().uuid()).max(20).default([]),
  days: z.array(organizationDaySchema).max(366).default([]),
  library: z.array(organizationDayBlockSchema).max(100).default([]),
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
    organization: organizationProgramConfigSchema.optional(),
    sections: z.array(programSectionSchema).min(1).max(120),
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
export type TrainingMaterial = z.infer<typeof trainingMaterialSchema>;
export type ProgramRecommendation = z.infer<typeof programRecommendationSchema>;
export type AssessmentConclusion = z.infer<typeof assessmentConclusionSchema>;
export type OrganizationDayBlock = z.infer<typeof organizationDayBlockSchema>;
export type OrganizationProgramConfig = z.infer<typeof organizationProgramConfigSchema>;
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
      if (!hasAnswer(answer)) continue;
      if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") {
        const best = Math.max(
          0,
          ...question.options.map((option) => option.score)
        );
        maximum += best;
        earned +=
          question.options.find((option) => option.id === (typeof answer === "boolean" ? String(answer) : answer))?.score ?? 0;
      } else if (["MULTIPLE_CHOICE", "MATCHING", "ORDERING"].includes(question.type)) {
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
    maximum > 0 ? resultSection?.resultBands.find(
      (candidate) =>
        percent >= candidate.minPercent && percent <= candidate.maxPercent
    ) ?? null : null;

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
    Array.isArray(value) ? value : typeof value === "string" || typeof value === "boolean" ? [String(value)] : []
  );
}

/** Option routes override the question default only when an option has a route. */
export function resolveAssessmentRoute(question: ProgramQuestion, answer: ProgramAnswer | undefined) {
  const selected = selectedOptionIds(answer);
  const options = question.options.filter((option) => selected.has(option.id));
  const routed = options.filter((option) => option.nextQuestionId || option.nextSectionId || option.conclusionId);
  return {
    nextQuestionIds: routed.length ? routed.flatMap((option) => option.nextQuestionId ? [option.nextQuestionId] : []) : question.nextQuestionId ? [question.nextQuestionId] : [],
    nextSectionIds: routed.length ? routed.flatMap((option) => option.nextSectionId ? [option.nextSectionId] : []) : question.nextSectionId ? [question.nextSectionId] : [],
    conclusionIds: routed.length ? routed.flatMap((option) => option.conclusionId ? [option.conclusionId] : []) : question.conclusionId ? [question.conclusionId] : [],
  };
}

function assessmentQuestionPath(section: ProgramSection, responses: ProgramResponses) {
  const questions: ProgramQuestion[] = [];
  const nextSectionIds: string[] = [];
  let skippedEvaluation = false;
  const visited = new Set<string>();
  let question: ProgramQuestion | undefined = section.questions.find((item) => item.id === section.assessment?.entryQuestionId)
    ?? section.questions[0];
  while (question && !visited.has(question.id)) {
    const currentQuestion: ProgramQuestion = question;
    visited.add(currentQuestion.id);
    questions.push(currentQuestion);
    const answer = responses[responseKey(section.id, currentQuestion.id)];
    if (currentQuestion.required && !hasAnswer(answer)) break;
    const route = resolveAssessmentRoute(currentQuestion, answer);
    const nextQuestionId: string | undefined = route.nextQuestionIds
      .find((id) => section.questions.some((item) => item.id === id))
    const routedSections = route.nextSectionIds;
    if (nextQuestionId) {
      nextSectionIds.push(...routedSections);
      question = section.questions.find((item) => item.id === nextQuestionId);
      continue;
    }
    if (routedSections.length) {
      nextSectionIds.push(...routedSections);
      skippedEvaluation = true;
      break;
    }
    if (route.conclusionIds.length) break;
    question = section.questions[section.questions.findIndex((item) => item.id === currentQuestion.id) + 1];
  }
  return { questions, nextSectionIds, skippedEvaluation };
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
  const root = sections.find((section) => !section.assessment?.parentSectionId && section.assessment?.blockType === "FIELD") ?? sections[0];
  const queue = [root];
  const visited = new Set<string>();
  const visitedSections: ProgramSection[] = [];

  while (queue.length) {
    const section = queue.shift();
    if (!section || visited.has(section.id)) continue;
    visited.add(section.id);
    visitedSections.push(section);

    for (const nextSectionId of assessmentQuestionPath(section, responses).nextSectionIds) {
      const next = byId.get(nextSectionId);
      if (next && !visited.has(next.id)) queue.push(next);
    }
  }

  return visitedSections;
}

export type AssessmentResult = {
  value?: number;
  valueLabel?: string;
  id: string;
  title: string;
  body: string;
  taxonomy?: TaxonomyAssignment;
  recommendations: z.infer<typeof programRecommendationSchema>[];
};

export type AssessmentHistory = Record<string, TrackSnapshot[]>;

export function buildAssessmentHistory(
  definition: ProgramDefinition,
  previousRuns: ProgramResponses[]
): AssessmentHistory {
  const history: AssessmentHistory = {};
  for (const responses of previousRuns) {
    for (const section of definition.sections) {
      if (section.assessment?.method !== "TRACK") continue;
      const snapshot = Object.fromEntries(
        section.questions.flatMap((question) => {
          const answer = responses[responseKey(section.id, question.id)];
          return answer !== undefined
            ? [[question.id, typeof answer === "boolean" ? String(answer) : answer as AssessmentAnswer]]
            : [];
        })
      ) as TrackSnapshot;
      if (Object.keys(snapshot).length) {
        history[section.id] = [...(history[section.id] ?? []), snapshot];
      }
    }
  }
  return history;
}

/** Uses the same method-specific evaluator as the admin preview. */
export function evaluateAssessmentResults(
  definition: ProgramDefinition,
  responses: ProgramResponses,
  history: AssessmentHistory = {}
): { results: AssessmentResult[]; messages: string[] } {
  const results: AssessmentResult[] = [];
  const messages: string[] = [];
  const reachable = getReachableAssessmentSections(definition, responses);
  const conclusions = new Map(
    definition.sections.flatMap((section) =>
      (section.assessment?.conclusions ?? []).map((conclusion) => [conclusion.id, conclusion] as const)
    )
  );

  for (const section of reachable) {
    if (!section.assessment) continue;
    const path = assessmentQuestionPath(section, responses);
    const answers = Object.fromEntries(
      path.questions.flatMap((question) => {
        const answer = responses[responseKey(section.id, question.id)];
        return answer !== undefined
          ? [[question.id, typeof answer === "boolean" ? String(answer) : answer as AssessmentAnswer]]
          : [];
      })
    ) as Record<string, AssessmentAnswer>;
    const leavesForAnotherSection = path.skippedEvaluation;
    // The preview enters the next section immediately, without evaluating the
    // parent section. A result route only applies at the end of a section.
    if (leavesForAnotherSection) continue;
    const lastQuestion = path.questions.at(-1);
    const directIds = (lastQuestion ? [lastQuestion] : []).flatMap((question) => {
      const answer = answers[question.id];
      if (answer === undefined) return [];
      return resolveAssessmentRoute(question, answer).conclusionIds;
    });
    const previous = history[section.id] ?? [];
    const snapshot = section.assessment.trackAgainst === "BASELINE"
      ? previous[0] ?? null
      : previous.at(-1) ?? null;
    const evaluation = directIds.length
      ? { results: directIds.flatMap((id) => {
          const conclusion = conclusions.get(id);
          return conclusion ? [{ id: conclusion.id, title: conclusion.title, body: conclusion.body, conclusion, value: undefined, valueLabel: undefined }] : [];
        }), message: undefined }
      : evaluateAssessmentSection(section, answers, snapshot);
    for (const result of evaluation.results) {
      if (results.some((existing) => existing.id === result.id)) continue;

      results.push({
        id: result.id,
        title: result.title,
        body: result.body,
        taxonomy: result.conclusion.taxonomy,
        recommendations: result.conclusion.recommendations,
        value: result.value,
        valueLabel: result.valueLabel,
      });
    }
    if (evaluation.message) messages.push(evaluation.message);
  }
  return { results, messages };
}

export function getAssessmentResults(
  definition: ProgramDefinition,
  responses: ProgramResponses,
  history: AssessmentHistory = {}
): AssessmentResult[] {
  return evaluateAssessmentResults(definition, responses, history).results;
}

export function getAssessmentProfileSummaries(
  definition: ProgramDefinition,
  responses: ProgramResponses
) {
  return getReachableAssessmentSections(definition, responses).flatMap((section) => {
    if (section.assessment?.method !== "PROFILE") return [];
    const path = assessmentQuestionPath(section, responses);
    if (path.skippedEvaluation) return [];
    const answers = Object.fromEntries(path.questions.map((question) => [
      question.id, responses[responseKey(section.id, question.id)],
    ]).filter((entry) => entry[1] !== undefined)) as Record<string, string | string[] | number>;
    const summary = evaluateProfile(section, answers).summary;
    return summary ? [summary] : [];
  });
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
    for (const question of isEmotionalAssessmentDefinition(definition)
      ? assessmentQuestionPath(section, responses).questions
      : section.questions) {
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
      item.type === "MATCHING" &&
      typeof value === "string" &&
      !item.options.some((option) => option.id === value)
    ) {
      return false;
    } else if (
      ["MULTIPLE_CHOICE", "MATCHING", "ORDERING"].includes(item.type) &&
      (item.type !== "MATCHING" || typeof value !== "string") &&
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
      if (typeof value !== "boolean" &&
        (typeof value !== "string" || !item.options.some((option) => option.id === value))) return false;
    } else if (
      item.type === "SCENARIO" &&
      (typeof value !== "string" || value.length > 10_000)
    )
      return false;
  }
  return true;
}
