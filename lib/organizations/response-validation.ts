import type { ContentPayload, OrganizationContentType, ResponseType } from "./program-contract";

function validForType(type: ResponseType, value: unknown, options: string[] = []) {
  if (type === "NONE") return value === true;
  if (type === "TEXT" || type === "LONG_TEXT") return typeof value === "string" && value.trim().length > 0 && value.length <= 8000;
  if (type === "SINGLE_CHOICE") return typeof value === "string" && options.includes(value);
  if (type === "MULTIPLE_CHOICE") return Array.isArray(value) && value.length > 0 && value.length <= 20 && value.every((item) => typeof item === "string" && options.includes(item));
  if (type === "SCALE_1_5") return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
  if (type === "SCALE_0_10") return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10;
  return false;
}

export function validateEmployeeValue(type: OrganizationContentType, payload: ContentPayload, value: unknown) {
  if (["ASSESSMENT", "IMPLEMENTATION", "FEEDBACK", "GRATITUDE"].includes(type) || (type === "PROGRAM" && !!payload.linkedProgramVersionId)) return false;
  if (type === "SUGGESTION") return !!value && typeof value === "object" && !Array.isArray(value) && Array.isArray((value as { selected?: unknown }).selected) && (value as { selected: unknown[] }).selected.length > 0 && (value as { selected: unknown[] }).selected.every((item) => typeof item === "string" && (payload.options ?? []).includes(item));
  if (type === "SURVEY") {
    if (!value || typeof value !== "object" || Array.isArray(value) || !payload.questions?.length) return false;
    const answers = value as Record<string, unknown>;
    return payload.questions.every((question) => validForType(question.responseType, answers[question.id], question.options));
  }
  const responseType = payload.responseType && payload.responseType !== "NONE" ? payload.responseType
    : type === "REFLECTION" ? "LONG_TEXT" : type === "CHECK_IN" ? "SCALE_1_5"
    : type === "PERSONAL_QUESTION" || type === "SUPERLATIVE_PACK" ? "SINGLE_CHOICE" : "NONE";
  return validForType(responseType, value, payload.options?.length ? payload.options : payload.answerDirections?.map((answer) => answer.label) ?? []);
}
