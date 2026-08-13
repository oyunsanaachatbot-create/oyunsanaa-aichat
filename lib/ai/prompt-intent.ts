export type SpecializedPromptIntent =
  | "finance"
  | "health"
  | "selfUnderstanding"
  | "tests"
  | "notes"
  | "programs"
  | "specialist"
  | "onlinePsychologist";

const INTENT_PATTERNS: Record<SpecializedPromptIntent, RegExp[]> = {
  finance: [
    /санхүү/iu,
    /\bsanhuu\b/iu,
    /мөнгө(?:ний|нөөс|өр|өө)?/iu,
    /орлог/iu,
    /зарлаг/iu,
    /төсөв/iu,
    /хуримтлал/iu,
    /гүйлгээ/iu,
    /баримт(?:ын|аа|аас|тай)?/iu,
    /зээл(?:ийн|тэй|ээ)?/iu,
  ],
  health: [
    /эрүүл\s*мэнд/iu,
    /\beruul\b/iu,
    /эрүүл\s*дадал/iu,
    /хоол(?:ны|лолт|лолтын|оо)?/iu,
    /шим\s*тэжээл/iu,
    /илчлэг/iu,
    /калори/iu,
    /усны\s*хэрэглээ/iu,
    /нойр/iu,
    /унт(?:ах|даг|сан|аж)?/iu,
    /хөдөлгөөн/iu,
    /дасгал/iu,
    /биеийн\s*(?:жин|байдал)/iu,
  ],
  selfUnderstanding: [
    /өөрийгөө\s*ойлго/iu,
    /амьдралын\s*тэнцвэр/iu,
    /тэнцвэрийн\s*хөтөлбөр/iu,
    /24\s*ур\s*чадвар/iu,
    /balance\s*model/iu,
  ],
  tests: [
    /сэтгэл\s*зүйн\s*тест/iu,
    /тест(?:ийн|үүд|ээ|ээр|тэй)?/iu,
    /асуумж(?:ийн|аа|аар)?/iu,
    /өөрийгөө\s*(?:шалгах|таних)/iu,
    /асуулт(?:ууд)?\s*бөгл/iu,
    /\btest(?:ийн|үүд|ээ)?\b/iu,
  ],
  notes: [
    /тэмдэглэл(?:ийн|ээ|ээс|д|тэй)?/iu,
    /тэмдэглэ(?:е|л|х)/iu,
    /миний\s*ертөнц/iu,
    /дурсамж/iu,
    /миний\s*булан/iu,
    /амьдралын\s*ном/iu,
    /бичлэг(?:ээ|ийг)?\s*хадгал/iu,
    /\btemdeglel\b/iu,
  ],
  programs: [
    /хөтөлбөр(?:ийн|үүд|өө|т|өөр|тэй)?/iu,
    /сургалт(?:ын|ууд|ад|аар)?/iu,
    /вебинар/iu,
    /лекц/iu,
    /семинар/iu,
    /хөгжлийн\s*хөтөлбөр/iu,
    /суралц(?:ах|маар)/iu,
    /\bhutulbur\b|\bsurgalt\b/iu,
  ],
  specialist: [
    /мэргэжилт(?:эн|ний|нээр|энд|энтэй|нээс)/iu,
    /сэтгэл\s*зүйч(?:ийн|ид|тэй|ээс|ээр)?/iu,
    /цаг(?:ийг|ийн|аа)?\s*(?:захиал|товл|баталгааж)/iu,
    /уулзалт(?:ын|аа|ыг)?\s*(?:захиал|товл|баталгааж)/iu,
    /цаг(?:ийг|ийн|аа)?\s*(?:ав|захиал|товл)/iu,
    /мэргэжлийн\s*(?:тусламж|хүн)/iu,
    /мэргэжилтнээр\s*бүртгүүл/iu,
    /\bmergejilten\b/iu,
  ],
  onlinePsychologist: [
    /онлайн\s*сэтгэл\s*зүйч/iu,
    /сэтгэл\s*зүйчтэй\s*(?:онлайн|чат)/iu,
    /бодит\s*сэтгэл\s*зүйчтэй\s*чат/iu,
    /бодит\s*(?:хүн|мэргэжилтэн)(?:тэй)?\s*чат/iu,
    /хүнтэй\s*шууд\s*чат/iu,
  ],
};

// Ижил өгүүлбэрт хэд хэдэн intent таарвал илүү тусгай үйлчилгээг түрүүлүүлнэ.
const INTENT_PRIORITY: SpecializedPromptIntent[] = [
  "onlinePsychologist",
  "specialist",
  "finance",
  "health",
  "selfUnderstanding",
  "tests",
  "notes",
  "programs",
];

const FOLLOW_UP_PATTERN =
  /^(?:за|тийм|үгүй|тэгвэл|тэгэхээр|тэгээд|дараа нь|үүнийг|түүнийг|тэгж|одоо яах|цааш нь|үргэлжлүүл|дахин тайлбарла|илүү дэлгэрүүл|надад (?:нэгийг|түүнийг))(?=\s|[,.!?]|$)/iu;

export function detectSpecializedPromptIntent(
  text: string
): SpecializedPromptIntent | null {
  const normalized = text.normalize("NFC").trim();
  if (!normalized) return null;

  for (const intent of INTENT_PRIORITY) {
    for (const pattern of INTENT_PATTERNS[intent]) {
      if (pattern.test(normalized)) return intent;
    }
  }

  return null;
}

export function isLikelyPromptFollowUp(text: string): boolean {
  const normalized = text.normalize("NFC").trim();
  return (
    normalized.length > 0 &&
    normalized.length <= 180 &&
    FOLLOW_UP_PATTERN.test(normalized)
  );
}

export function resolveSpecializedPromptIntent({
  latestUserText,
  previousUserTexts = [],
}: {
  latestUserText: string;
  /** Хамгийн сүүлийн өмнөх user turn-ээс эхэлсэн дараалал. */
  previousUserTexts?: string[];
}): SpecializedPromptIntent | null {
  const directIntent = detectSpecializedPromptIntent(latestUserText);
  if (directIntent) return directIntent;

  if (!isLikelyPromptFollowUp(latestUserText)) return null;

  for (const previousText of previousUserTexts.slice(0, 6)) {
    const previousIntent = detectSpecializedPromptIntent(previousText);
    if (previousIntent) return previousIntent;
  }

  return null;
}
