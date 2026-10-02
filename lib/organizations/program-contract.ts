/** Versioned wire contract shared with oyunsanaa-aichat. Keep both copies equal. */
export const ORGANIZATION_CONTRACT_VERSION = 1;
const lineBreak = /\r?\n/;

export const organizationContentTypes = [
  "WORD_PACK", "GRATITUDE", "SUPERLATIVE_PACK", "TRAINING", "AUDIO",
  "REMINDER", "CHECK_IN", "PERSONAL_QUESTION", "ORGANIZATION_QUESTION",
  "FEEDBACK", "REFLECTION", "SURVEY", "ASSESSMENT", "TASK", "PROGRAM",
  "MANAGER_MESSAGE", "IMPLEMENTATION", "SUGGESTION",
] as const;

export const organizationContentLabels: Record<(typeof organizationContentTypes)[number], string> = {
  WORD_PACK: "Оюунсанаагийн үг", GRATITUDE: "Талархал", SUPERLATIVE_PACK: "Хамгийн-хамгийн",
  TRAINING: "Сургалт / мэдлэг", AUDIO: "Аудио / дасгал", REMINDER: "Сануулга",
  CHECK_IN: "Check-in", PERSONAL_QUESTION: "Хувийн асуулт", ORGANIZATION_QUESTION: "Байгууллагын асуулт",
  FEEDBACK: "Санал хүсэлт", REFLECTION: "Эргэцүүлэл", SURVEY: "Санал асуулга", ASSESSMENT: "Үнэлгээ",
  TASK: "Даалгавар", PROGRAM: "Хөтөлбөр", MANAGER_MESSAGE: "Удирдлагын үг",
  IMPLEMENTATION: "Хэрэгжүүлэлт", SUGGESTION: "Санал болгох зүйл",
};

export type OrganizationContentType = (typeof organizationContentTypes)[number];
export type MeasurementPolicy = "DELIVERY" | "PARTICIPATION" | "RESPONSE_AGGREGATE" | "PERSONAL_RESULT" | "IMPLEMENTATION";
export type PrivacyPolicy = "NONE" | "PERSONAL_ONLY" | "AGGREGATE" | "ANONYMOUS_FEEDBACK";
export type EmployeeLevel = "EXECUTIVE" | "MANAGER" | "TEAM_LEAD" | "EMPLOYEE" | "SUPPORT";
export type ResponseType = "NONE" | "TEXT" | "LONG_TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SCALE_1_5" | "SCALE_0_10";

export const employeeLevels: EmployeeLevel[] = ["EXECUTIVE", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "SUPPORT"];

export const contentPolicy: Record<OrganizationContentType, { measurement: MeasurementPolicy; privacy: PrivacyPolicy; authorable: boolean }> = {
  WORD_PACK: { measurement: "DELIVERY", privacy: "NONE", authorable: true },
  GRATITUDE: { measurement: "PARTICIPATION", privacy: "PERSONAL_ONLY", authorable: true },
  SUPERLATIVE_PACK: { measurement: "PARTICIPATION", privacy: "AGGREGATE", authorable: true },
  TRAINING: { measurement: "PARTICIPATION", privacy: "NONE", authorable: true },
  AUDIO: { measurement: "PARTICIPATION", privacy: "NONE", authorable: true },
  REMINDER: { measurement: "DELIVERY", privacy: "NONE", authorable: true },
  CHECK_IN: { measurement: "RESPONSE_AGGREGATE", privacy: "AGGREGATE", authorable: true },
  PERSONAL_QUESTION: { measurement: "PERSONAL_RESULT", privacy: "PERSONAL_ONLY", authorable: true },
  ORGANIZATION_QUESTION: { measurement: "RESPONSE_AGGREGATE", privacy: "AGGREGATE", authorable: true },
  FEEDBACK: { measurement: "IMPLEMENTATION", privacy: "ANONYMOUS_FEEDBACK", authorable: true },
  REFLECTION: { measurement: "PARTICIPATION", privacy: "PERSONAL_ONLY", authorable: true },
  SURVEY: { measurement: "RESPONSE_AGGREGATE", privacy: "AGGREGATE", authorable: true },
  ASSESSMENT: { measurement: "PERSONAL_RESULT", privacy: "PERSONAL_ONLY", authorable: true },
  TASK: { measurement: "PARTICIPATION", privacy: "PERSONAL_ONLY", authorable: true },
  PROGRAM: { measurement: "PARTICIPATION", privacy: "NONE", authorable: true },
  MANAGER_MESSAGE: { measurement: "DELIVERY", privacy: "NONE", authorable: true },
  IMPLEMENTATION: { measurement: "IMPLEMENTATION", privacy: "NONE", authorable: false },
  SUGGESTION: { measurement: "IMPLEMENTATION", privacy: "NONE", authorable: true },
};

export type ContentPayload = {
  title: string;
  body?: string;
  prompt?: string;
  responseType?: ResponseType;
  options?: string[];
  questions?: Array<{ id: string; prompt: string; responseType: ResponseType; options?: string[] }>;
  url?: string;
  audioUrl?: string;
  assessmentProgramVersionId?: string;
  linkedProgramVersionId?: string;
  assessmentRole?: "BASELINE" | "INTERIM" | "FINAL" | "REGULAR";
  repeatDays?: number;
  directionIds?: string[];
  answerDirections?: Array<{ label: string; directionId: string }>;
  [key: string]: unknown;
};

export function validateContent(type: OrganizationContentType, payload: ContentPayload): string[] {
  const errors: string[] = [];
  if (!payload.title?.trim()) errors.push("Гарчиг шаардлагатай.");
  if (payload.title?.length > 500) errors.push("Гарчиг 500 тэмдэгтээс хэтэрсэн.");
  if (typeof payload.body === "string" && payload.body.length > 8000) errors.push("Үндсэн бичвэр 8000 тэмдэгтээс хэтэрсэн.");
  if (typeof payload.prompt === "string" && payload.prompt.length > 2000) errors.push("Асуулт 2000 тэмдэгтээс хэтэрсэн.");
  const hasText = Boolean(payload.body?.trim() || payload.prompt?.trim());
  if (["WORD_PACK", "REMINDER", "MANAGER_MESSAGE", "TASK"].includes(type) && !hasText) errors.push("Бичвэр шаардлагатай.");
  if (type === "TRAINING" && !hasText && !payload.url) errors.push("Сургалтын бичвэр эсвэл холбоос шаардлагатай.");
  if (type === "AUDIO" && !payload.audioUrl) errors.push("Аудио холбоос шаардлагатай.");
  if (type === "SUPERLATIVE_PACK" && (!payload.prompt?.trim() || (payload.options?.filter(Boolean).length ?? 0) < 2)) errors.push("Асуулт болон хоёр буюу түүнээс олон сонголт шаардлагатай.");
  if (["CHECK_IN", "ORGANIZATION_QUESTION"].includes(type) && (!payload.prompt?.trim() || !payload.responseType || payload.responseType === "NONE")) errors.push("Асуулт болон хариултын төрөл шаардлагатай.");
  if (type === "ORGANIZATION_QUESTION" && !String(payload.category ?? "").trim()) errors.push("Байгууллагын асуултын ангилал шаардлагатай.");
  if (type === "ORGANIZATION_QUESTION" && typeof payload.audience === "string" && !["ALL", ...employeeLevels].includes(payload.audience)) errors.push("Хэнд хүргэх ангилал буруу байна.");
  if (type === "PROGRAM" && !payload.linkedProgramVersionId && !(payload.legacyBlockId && payload.linkedProgramId)) errors.push("Нийтлэгдсэн хөтөлбөрийн хувилбар сонгоно.");
  if (type === "SUGGESTION" && (payload.options?.filter(Boolean).length ?? 0) < 1) errors.push("Санал болгох нэг буюу түүнээс олон сонголт шаардлагатай.");
  if (type === "IMPLEMENTATION") errors.push("Хэрэгжүүлэлт нь агуулга биш; хэрэгжилтийн бүртгэлээр үүсгэнэ.");
  if (type === "ASSESSMENT" && !payload.assessmentProgramVersionId) errors.push("Нийтлэгдсэн үнэлгээний хувилбар сонгоно.");
  if (type === "PERSONAL_QUESTION" && !payload.legacyBlockId && (!payload.prompt?.trim() || (payload.answerDirections?.length ?? 0) < 2 || new Set(payload.answerDirections?.map((answer) => answer.directionId)).size < 2 || payload.answerDirections?.some((answer) => !answer.label.trim() || !answer.directionId.trim()))) errors.push("Асуулт, хоёр буюу түүнээс олон хариулт, чиглэл шаардлагатай.");
  if (type === "REFLECTION" && payload.responseType !== "TEXT" && payload.responseType !== "LONG_TEXT") errors.push("Эргэцүүлэл текстэн хариулттай байна.");
  if (type === "SURVEY" && !payload.questions?.length) errors.push("Санал асуулга дор хаяж нэг асуулттай байна.");
  const questions = payload.questions ?? [];
  if (questions.length > 20) errors.push("Санал асуулга 20-иос олон асуулттай байж болохгүй.");
  if (new Set(questions.map((question) => question.id)).size !== questions.length) errors.push("Асуултын ID давхардсан байна.");
  for (const [index, question] of questions.entries()) {
    if (!question.prompt.trim()) errors.push(`${index + 1}-р асуулт хоосон байна.`);
    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.responseType) && (question.options?.filter(Boolean).length ?? 0) < 2) errors.push(`${index + 1}-р асуултад хоёр сонголт шаардлагатай.`);
  }
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(payload.responseType ?? "NONE") && (payload.options?.filter(Boolean).length ?? 0) < 2) errors.push("Хоёр сонголт шаардлагатай.");
  if (payload.options && new Set(payload.options.map((option) => option.trim())).size !== payload.options.length) errors.push("Сонголт давхардсан байна.");
  for (const url of [payload.url, payload.audioUrl]) if (url) {
    try { if (!["https:", "http:"].includes(new URL(url).protocol)) errors.push("HTTP эсвэл HTTPS холбоос шаардлагатай."); }
    catch { errors.push("Холбоос буруу байна."); }
  }
  if (payload.repeatDays !== undefined && (!Number.isInteger(payload.repeatDays) || payload.repeatDays < 1 || payload.repeatDays > 365)) errors.push("Давталт 1–365 өдөр байна.");
  return errors;
}

export function parseBulkLines(text: string) {
  return text.split(lineBreak).map((raw, index) => ({ line: index + 1, raw: raw.trim() })).filter((row) => row.raw);
}

export function safePartition(total: number, parts: number[], minimum: number) {
  if (total < minimum || parts.some((part) => part > 0 && part < minimum)) return { total: total >= minimum ? total : null, parts: parts.map(() => null) };
  return { total, parts };
}

export function safeRatio(eligible: number, counted: number, minimum: number) {
  const remainder = eligible - counted;
  const suppressed = eligible < minimum || counted < 0 || counted > eligible
    || (counted > 0 && counted < minimum) || (remainder > 0 && remainder < minimum);
  return {
    eligible: eligible >= minimum ? eligible : null,
    counted: suppressed ? null : counted,
    percent: suppressed || eligible === 0 ? null : Math.round(counted / eligible * 100),
    suppressed,
  };
}
