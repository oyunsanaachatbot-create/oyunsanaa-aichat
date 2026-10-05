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

export type AssessmentEvaluation = {
  status: "RESULT" | "INSUFFICIENT" | "BASELINE" | "UNSUPPORTED" | "NO_MATCH";
  results: AssessmentResult[];
  message?: string;
  answeredCount: number;
};

export type TrackSnapshot = Record<string, AssessmentAnswer>;

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

function applyResultMode(section: ProgramSection, results: AssessmentResult[]) {
  return section.assessment?.resultMode === "SINGLE"
    ? results.slice(0, 1)
    : results;
}

function assessmentFor(section: ProgramSection) {
  if (!section.assessment) throw new Error("assessment_missing");
  return section.assessment;
}

function evaluateScore(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
): AssessmentEvaluation {
  const assessment = assessmentFor(section);
  const values = section.questions
    .filter((question) => isAnswered(answers[question.id]))
    .map((question) => numericAnswer(question, answers[question.id]));

  if (["SUBSCORE", "CUSTOM"].includes(assessment.scoreCalculation ?? "SUM")) {
    return {
      status: "UNSUPPORTED",
      results: [],
      answeredCount: values.length,
      message: `${assessment.scoreCalculation} тооцоололд нэмэлт дүрэм шаардлагатай. Одоогийн schema-д тэр дүрэм хадгалах талбар алга байна.`,
    };
  }

  const sum = values.reduce((total, value) => total + value, 0);
  const score =
    assessment.scoreCalculation === "AVERAGE" && values.length
      ? Math.round((sum / values.length) * 100) / 100
      : sum;
  const matched = assessment.conclusions
    .filter(
      (conclusion) =>
        conclusion.match?.kind === "SCORE_RANGE" && inRange(score, conclusion)
    )
    .map((conclusion) =>
      toResult(
        conclusion,
        score,
        assessment.scoreCalculation === "AVERAGE" ? "Дундаж оноо" : "Нийт оноо"
      )
    );

  return {
    status: matched.length ? "RESULT" : "NO_MATCH",
    results: applyResultMode(section, matched),
    answeredCount: values.length,
    message: matched.length
      ? undefined
      : "Энэ оноонд тохирох дүгнэлтийн муж тохируулаагүй байна.",
  };
}

function evaluateProfile(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
): AssessmentEvaluation {
  const assessment = assessmentFor(section);
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

  return {
    status: results.length ? "RESULT" : "NO_MATCH",
    results,
    answeredCount: answeredQuestionCount(section, answers),
    message: results.length
      ? undefined
      : "Талуудын оноонд тохирох дүгнэлт тохируулаагүй байна.",
  };
}

function patternMatches(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>,
  conclusion: AssessmentConclusion
) {
  const patternId = conclusion.match?.referenceId;
  const pattern = section.assessment?.patterns.find(
    (item) => item.id === patternId
  );
  if (!pattern) return false;
  const chosen = new Set(
    section.questions.flatMap((question) => selectedIds(answers[question.id]))
  );
  if (pattern.excludedOptionIds.some((id) => chosen.has(id))) return false;
  const count = pattern.requiredOptionIds.filter((id) => chosen.has(id)).length;
  if (pattern.matchMode === "ALL")
    return count === pattern.requiredOptionIds.length;
  if (pattern.matchMode === "ANY") return count > 0;
  return count >= pattern.minimumMatches;
}

function evaluatePattern(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
): AssessmentEvaluation {
  const assessment = assessmentFor(section);
  const matched = assessment.conclusions
    .filter(
      (conclusion) =>
        conclusion.match?.kind === "PATTERN" &&
        patternMatches(section, answers, conclusion)
    )
    .map((conclusion) => toResult(conclusion));
  const fallback = assessment.conclusions.find(
    (conclusion) => conclusion.match?.kind === "TERMINAL"
  );
  const results = matched.length
    ? applyResultMode(section, matched)
    : fallback
      ? [toResult(fallback)]
      : [];
  return {
    status: results.length ? "RESULT" : "NO_MATCH",
    results,
    answeredCount: answeredQuestionCount(section, answers),
    message: results.length
      ? undefined
      : "Тохирох хэв маягийн дүгнэлт болон fallback дүгнэлт тохируулаагүй байна.",
  };
}

function exactSetMatch(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((item) => expected.has(item));
}

function directQuestionScore(
  question: ProgramQuestion,
  answer: AssessmentAnswer | undefined,
  partial: boolean
) {
  if (!isAnswered(answer)) return null;
  const correct = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.id);
  if (!correct.length) return null;
  const chosen = selectedIds(answer);
  if (!partial) return exactSetMatch(chosen, correct) ? 1 : 0;
  const correctChosen = chosen.filter((id) => correct.includes(id)).length;
  const wrongChosen = chosen.filter((id) => !correct.includes(id)).length;
  return Math.max(
    0,
    Math.min(1, (correctChosen - wrongChosen) / correct.length)
  );
}

function evaluateDirect(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
): AssessmentEvaluation {
  const assessment = assessmentFor(section);
  const scored = section.questions
    .map((question) =>
      directQuestionScore(
        question,
        answers[question.id],
        Boolean(assessment.allowPartialCredit)
      )
    )
    .filter((value): value is number => value !== null);

  if (!scored.length) {
    return {
      status: "UNSUPPORTED",
      results: [],
      answeredCount: answeredQuestionCount(section, answers),
      message:
        "Мэдлэг, чадварын үнэлгээнд зөв хариулт (isCorrect) тохируулсан сонголт хэрэгтэй.",
    };
  }

  const percent =
    Math.round(
      (scored.reduce((sum, value) => sum + value, 0) / scored.length) * 10_000
    ) / 100;
  const matched = assessment.conclusions
    .filter(
      (conclusion) =>
        conclusion.match?.kind === "KNOWLEDGE_RANGE" &&
        inRange(percent, conclusion)
    )
    .map((conclusion) => toResult(conclusion, percent, "Гүйцэтгэл %"));

  return {
    status: matched.length ? "RESULT" : "NO_MATCH",
    results: applyResultMode(section, matched),
    answeredCount: answeredQuestionCount(section, answers),
    message: matched.length
      ? undefined
      : "Энэ хувьд тохирох дүгнэлтийн муж тохируулаагүй байна.",
  };
}

function evaluateContext(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>
): AssessmentEvaluation {
  const assessment = assessmentFor(section);
  const chosen = new Set(
    section.questions.flatMap((question) => selectedIds(answers[question.id]))
  );
  const matched = assessment.conclusions
    .filter(
      (conclusion) =>
        conclusion.match?.kind === "ANSWER" &&
        Boolean(
          conclusion.match.referenceId &&
            chosen.has(conclusion.match.referenceId)
        )
    )
    .map((conclusion) => toResult(conclusion));
  const fallback = assessment.conclusions.find(
    (conclusion) => conclusion.match?.kind === "TERMINAL"
  );
  const results = matched.length
    ? applyResultMode(section, matched)
    : fallback
      ? [toResult(fallback)]
      : [];
  return {
    status: results.length ? "RESULT" : "NO_MATCH",
    results,
    answeredCount: answeredQuestionCount(section, answers),
  };
}

function trackMetricValue(
  section: ProgramSection,
  answers: TrackSnapshot,
  questionId?: string
) {
  if (!questionId) return null;
  const question = section.questions.find((item) => item.id === questionId);
  if (!question || !isAnswered(answers[questionId])) return null;
  const answer = answers[questionId];
  if (typeof answer === "number") return answer;
  return numericAnswer(question, answer);
}

export function evaluateTrack(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>,
  previous: TrackSnapshot | null
): AssessmentEvaluation {
  const assessment = assessmentFor(section);
  const answeredCount = answeredQuestionCount(section, answers);
  if (!previous) {
    return {
      status: "BASELINE",
      results: [],
      answeredCount,
      message: `Эхний хэмжилт хадгалагдана. ${assessment.repeatDays ?? 14} хоногийн дараа дахин бөглөж өөрчлөлтөө харьцуулна.`,
    };
  }

  let improved = 0;
  let declined = 0;
  let compared = 0;
  for (const metric of assessment.metrics) {
    const before = trackMetricValue(section, previous, metric.questionId);
    const now = trackMetricValue(section, answers, metric.questionId);
    if (before === null || now === null) continue;
    compared += 1;
    const delta = now - before;
    const threshold = metric.threshold ?? 0;
    if (Math.abs(delta) <= threshold || metric.direction === "NEUTRAL")
      continue;
    const positive =
      metric.direction === "HIGHER_IS_POSITIVE" ? delta > 0 : delta < 0;
    if (positive) improved += 1;
    else declined += 1;
  }

  if (!compared) {
    return {
      status: "UNSUPPORTED",
      results: [],
      answeredCount,
      message:
        "Харьцуулах metric-ийн questionId болон тоон хариултыг бүрэн тохируулна уу.",
    };
  }

  const direction =
    improved > declined
      ? "IMPROVED"
      : declined > improved
        ? "DECLINED"
        : "UNCHANGED";
  const conclusion = assessment.conclusions.find(
    (item) =>
      item.match?.kind === "CHANGE" && item.match.direction === direction
  );
  return {
    status: conclusion ? "RESULT" : "NO_MATCH",
    results: conclusion ? [toResult(conclusion)] : [],
    answeredCount,
    message: conclusion
      ? undefined
      : `${direction} төлөвт тохирох дүгнэлт тохируулаагүй байна.`,
  };
}

export function evaluateAssessmentSection(
  section: ProgramSection,
  answers: Record<string, AssessmentAnswer>,
  previousTrackSnapshot: TrackSnapshot | null = null
): AssessmentEvaluation {
  const assessment = section.assessment;
  if (!assessment) {
    return {
      status: "NO_MATCH",
      results: [],
      answeredCount: 0,
      message: "Үнэлгээний тохиргоо алга байна.",
    };
  }

  const answeredCount = answeredQuestionCount(section, answers);
  if (answeredCount < assessment.minimumAnswers) {
    return {
      status: "INSUFFICIENT",
      results: [],
      answeredCount,
      message:
        assessment.insufficientDataMessage ||
        `Дүгнэлт гаргахад хамгийн багадаа ${assessment.minimumAnswers} хариулт шаардлагатай.`,
    };
  }

  if (assessment.method === "SCORE") return evaluateScore(section, answers);
  if (assessment.method === "PROFILE") return evaluateProfile(section, answers);
  if (assessment.method === "PATTERN") return evaluatePattern(section, answers);
  if (assessment.method === "DIRECT") return evaluateDirect(section, answers);
  if (assessment.method === "CONTEXT") return evaluateContext(section, answers);
  return evaluateTrack(section, answers, previousTrackSnapshot);
}
