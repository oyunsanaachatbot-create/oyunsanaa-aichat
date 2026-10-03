import type {
  AssessmentConclusion,
  ProgramQuestion,
  ProgramSection,
} from "@/lib/programs/definition";

export type AssessmentAnswer = string | string[] | number;

export type AssessmentResult = {
  id: string;
  title: string;
  body: string;
  conclusion: AssessmentConclusion;
  value?: number;
  valueLabel?: string;
  sourceId?: string;
};

export type AssessmentProfileSummaryResult = {
  id: string;
  title: string;
  body: string;
  value: number;
};

export type AssessmentEvaluation = {
  status: "RESULT" | "INSUFFICIENT" | "BASELINE" | "UNSUPPORTED" | "NO_MATCH";
  results: AssessmentResult[];
  summary?: AssessmentProfileSummaryResult;
  message?: string;
  answeredCount: number;
};

function isAnswered(answer: AssessmentAnswer | undefined) {
  if (Array.isArray(answer)) return answer.length > 0;
  return answer !== undefined && answer !== "";
}

export function answeredQuestionCount(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
) {
  return section.questions.filter((question) =>
    isAnswered(answers[question.id])
  ).length;
}

function selectedIds(answer: AssessmentAnswer | undefined) {
  if (Array.isArray(answer)) return answer;
  return typeof answer === "string" ? [answer] : [];
}

function numericAnswer(
  question: ProgramQuestion,
  answer: AssessmentAnswer | undefined
) {
  if (typeof answer === "number") return answer;
  const chosen = selectedIds(answer);
  return question.options
    .filter((option) => chosen.includes(option.id))
    .reduce((sum, option) => sum + (option.score ?? 0), 0);
}

function inRange(value: number, conclusion: AssessmentConclusion) {
  const match = conclusion.match;
  if (!match) return false;
  return (
    (match.min === undefined || value >= match.min) &&
    (match.max === undefined || value <= match.max)
  );
}

function toResult(
  conclusion: AssessmentConclusion,
  value?: number,
  valueLabel?: string,
  sourceId?: string
): AssessmentResult {
  return {
    id: conclusion.id,
    title: conclusion.title,
    body: conclusion.body,
    conclusion,
    value,
    valueLabel,
    sourceId,
  };
}

export function evaluateProfile(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
): AssessmentEvaluation {
  const assessment = section.assessment;
  if (!assessment) return { status: "NO_MATCH", results: [], answeredCount: 0 };
  const answeredCount = answeredQuestionCount(section, answers);
  if (answeredCount < assessment.minimumAnswers) {
    return { status: "INSUFFICIENT", results: [], answeredCount };
  }
  const rows = assessment.aspects
    .flatMap((aspect) => {
      const questions = aspect.questionIds
        .map((id) => section.questions.find((question) => question.id === id))
        .filter((question): question is ProgramQuestion => Boolean(question))
        .filter((question) => isAnswered(answers[question.id]));
      if (!questions.length) return [];

      const values = questions.map((question) =>
        numericAnswer(question, answers[question.id])
      );
      const average =
        Math.round(
          (values.reduce((sum, value) => sum + value, 0) / values.length) * 100
        ) / 100;
      const candidates = assessment.conclusions.filter(
        (candidate) =>
          candidate.match?.kind === "ASPECT" &&
          candidate.match.referenceId === aspect.id
      );
      const hasRanges = candidates.some(
        (candidate) =>
          candidate.match?.min !== undefined ||
          candidate.match?.max !== undefined
      );
      const conclusion = hasRanges
        ? candidates.find((candidate) => inRange(average, candidate))
        : candidates[0];

      return [{ aspect, average, conclusion }];
    })
    .sort((a, b) => b.average - a.average);

  const selectedRows =
    assessment.profileSelection === "SINGLE" ? rows.slice(0, 1) : rows;
  const results = selectedRows.flatMap(({ aspect, average, conclusion }) =>
    conclusion ? [toResult(conclusion, average, "Талын дундаж", aspect.id)] : []
  );
  const overallAverage = rows.length
    ? Math.round(
        (rows.reduce((sum, row) => sum + row.average, 0) / rows.length) * 100
      ) / 100
    : 0;
  const summaryDefinition = assessment.profileSummaries.find(
    (item) =>
      (item.minAverage === undefined || overallAverage >= item.minAverage) &&
      (item.maxAverage === undefined || overallAverage <= item.maxAverage)
  );
  const summary = summaryDefinition
    ? {
        id: summaryDefinition.id,
        title: summaryDefinition.title,
        body: summaryDefinition.body,
        value: overallAverage,
      }
    : undefined;

  return {
    status: results.length ? "RESULT" : "NO_MATCH",
    results,
    summary,
    answeredCount: answeredQuestionCount(section, answers),
    message: results.length
      ? undefined
      : "Талуудын оноонд тохирох дүгнэлт тохируулаагүй байна.",
  };
}
