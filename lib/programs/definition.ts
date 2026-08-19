import { z } from "zod";
import { taxonomyAssignmentSchema } from "@/lib/taxonomy/schema";

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
  })
  .superRefine((question, context) => {
    if (
      ["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.type) &&
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

export const programResultBandSchema = z
  .object({
    id: stableIdSchema,
    minPercent: z.number().int().min(0).max(100),
    maxPercent: z.number().int().min(0).max(100),
    title: z.string().trim().min(1).max(300),
    body: z.string().trim().min(1).max(8000),
    taxonomy: taxonomyAssignmentSchema.optional(),
  })
  .refine((band) => band.minPercent <= band.maxPercent, {
    message: "Үр дүнгийн доод хувь дээд хувиас их байж болохгүй.",
    path: ["maxPercent"],
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

export const programSectionSchema = z.object({
  id: stableIdSchema,
  type: z.enum(programSectionTypes),
  title: z.string().trim().min(1).max(500),
  subtitle: z.string().trim().max(1000).optional(),
  body: z.string().trim().max(20_000).optional(),
  skippable: z.boolean().default(false),
  questions: z.array(programQuestionSchema).max(100).default([]),
  tasks: z.array(programTaskSchema).max(100).default([]),
  repeatDays: z.number().int().min(1).max(365).default(1),
  resultBands: z.array(programResultBandSchema).max(20).default([]),
  recommendations: z.array(programRecommendationSchema).max(3).default([]),
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
    if (
      definition.contentType === "EMOTIONAL_EDUCATION" &&
      !definition.sections.some((section) => section.type === "RESULT")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Сэтгэлийн боловсрол дүгнэлтийн хэсэгтэй байна.",
        path: ["sections"],
      });
    }
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
export type ProgramQuestion = z.infer<typeof programQuestionSchema>;
export type ProgramRecommendation = z.infer<typeof programRecommendationSchema>;
export type ProgramAnswer = string | number | string[] | boolean;
export type ProgramResponses = Record<string, ProgramAnswer>;

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

  for (const section of definition.sections) {
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
  for (const section of definition.sections) {
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
      item.type === "MULTIPLE_CHOICE" &&
      (!Array.isArray(value) ||
        value.length > item.options.length ||
        value.some(
          (selected) =>
            typeof selected !== "string" ||
            !item.options.some((option) => option.id === selected)
        ))
    ) {
      return false;
    }
  }
  return true;
}
