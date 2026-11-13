/** Version 2 is additive; older published definitions and stored answers retain their meaning. */
type ChoiceQuestion = {
  type: string;
  interactionVersion?: number;
  options: { id: string; label: string; matchLabel?: string }[];
};
type Answer = string | string[] | number | boolean | undefined;

export function matchingPairs(answer: Answer): Map<string, string> {
  const pairs = new Map<string, string>();
  if (Array.isArray(answer))
    for (const value of answer) {
      const [left, right, extra] = value.split("=");
      if (left && right && extra === undefined) pairs.set(left, right);
    }
  return pairs;
}

export function validChoiceAnswer(question: ChoiceQuestion, answer: Answer) {
  const ids = new Set(question.options.map((option) => option.id));
  if (question.type === "MATCHING" && question.interactionVersion === 2) {
    if (!Array.isArray(answer)) return false;
    const pairs = matchingPairs(answer);
    return (
      pairs.size === answer.length &&
      pairs.size <= ids.size &&
      new Set(pairs.values()).size === pairs.size &&
      [...pairs].every(([left, right]) => ids.has(left) && ids.has(right))
    );
  }
  if (question.type === "MATCHING" && typeof answer === "string")
    return ids.has(answer);
  return (
    Array.isArray(answer) &&
    answer.length <= ids.size &&
    new Set(answer).size === answer.length &&
    answer.every((id) => ids.has(id))
  );
}

export function isQuestionAnswered(question: ChoiceQuestion, answer: Answer) {
  if (
    question.interactionVersion === 2 &&
    ["MATCHING", "ORDERING"].includes(question.type)
  ) {
    return (
      validChoiceAnswer(question, answer) &&
      Array.isArray(answer) &&
      answer.length === question.options.length
    );
  }
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "string") return answer.trim().length > 0;
  return answer !== undefined;
}

/** Only correctly paired/positioned choices earn their configured scores in v2. */
export function scoredOptionIds(
  question: ChoiceQuestion,
  answer: Answer
): string[] {
  if (question.interactionVersion === 2 && question.type === "MATCHING") {
    return [...matchingPairs(answer)]
      .filter(([left, right]) => left === right)
      .map(([left]) => left);
  }
  if (question.interactionVersion === 2 && question.type === "ORDERING") {
    return Array.isArray(answer)
      ? answer.filter((id, index) => question.options[index]?.id === id)
      : [];
  }
  return [
    ...new Set(
      Array.isArray(answer)
        ? answer
        : typeof answer === "string" || typeof answer === "boolean"
          ? [String(answer)]
          : []
    ),
  ];
}

export function programCompletionPercent(
  definition: {
    sections: {
      id: string;
      skippable: boolean;
      questions: (ChoiceQuestion & { id: string; required: boolean })[];
      tasks: { id: string; required: boolean }[];
      repeatDays: number;
    }[];
  },
  responses: Record<string, Answer>,
  completed: boolean
) {
  if (completed) return 100;
  let total = 0;
  let answered = 0;
  for (const section of definition.sections) {
    if (section.skippable) continue;
    for (const question of section.questions)
      if (question.required) {
        total++;
        if (
          isQuestionAnswered(
            question,
            responses[`${section.id}.${question.id}`]
          )
        )
          answered++;
      }
    for (const task of section.tasks)
      if (task.required)
        for (let day = 1; day <= section.repeatDays; day++) {
          total++;
          if (responses[`${section.id}.${task.id}.day-${day}`] === true)
            answered++;
        }
  }
  // The final percentage is confirmed only by the persisted COMPLETE response.
  return total ? Math.min(99, Math.floor((answered / total) * 100)) : 0;
}
