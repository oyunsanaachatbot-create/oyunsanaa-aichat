const ACTIVE_ARTIFACT_STOP_WORDS = new Set([
  "байна",
  "бэ",
  "бол",
  "гэж",
  "гэх",
  "дээр",
  "дээрх",
  "нь",
  "талаар",
  "тэгээд",
  "тэр",
  "тухай",
  "хэрхэн",
  "хэдэн",
  "хэн",
  "юу",
]);
const NON_WORD_CHARACTERS = /[^\p{L}\p{N}]+/gu;
const WHITESPACE = /\s+/;
const ACTIVE_ARTIFACT_REFERENCE =
  /(?:^|[^\p{L}\p{N}])(энэ|дээрх|нийтлэл|бичвэр|сэдэв|уншиж|уншсан|номын|дэлгэрүүл|тайлбарла|ойлгуул|тухай|талаар)(?:$|[^\p{L}\p{N}])/iu;

function meaningfulTerms(text: string) {
  return new Set(
    text
      .toLocaleLowerCase("mn-MN")
      .replace(NON_WORD_CHARACTERS, " ")
      .split(WHITESPACE)
      .filter(
        (term) => term.length >= 3 && !ACTIVE_ARTIFACT_STOP_WORDS.has(term)
      )
  );
}

/**
 * An opened article is useful context only when the current message points
 * to it. It must never become a hidden topic for a new, unrelated chat.
 */
export function shouldUseActiveArtifactContext(
  userText: string,
  title: string,
  content: string
) {
  const query = userText.trim();
  if (!query) return false;

  if (ACTIVE_ARTIFACT_REFERENCE.test(query)) return true;

  const queryTerms = meaningfulTerms(query);
  const titleTerms = meaningfulTerms(title);
  const contentTerms = meaningfulTerms(content.slice(0, 1800));
  const hasTermMatch = (term: string, terms: Set<string>) =>
    [...terms].some(
      (queryTerm) =>
        queryTerm === term ||
        queryTerm.startsWith(term) ||
        term.startsWith(queryTerm)
    );
  const titleOverlap = [...titleTerms].filter((term) =>
    hasTermMatch(term, queryTerms)
  );

  // A specific title match is enough for questions such as
  // “Тогтвортой амьдрал гэж юу вэ?”. Generic words from the article body are
  // deliberately ignored so “Hi” and other small talk stay context-free.
  const requiredTitleMatches = Math.min(2, Math.max(1, titleTerms.size));
  if (titleOverlap.length >= requiredTitleMatches) return true;

  const contentOverlap = [...contentTerms].filter((term) =>
    hasTermMatch(term, queryTerms)
  );
  return contentOverlap.length >= 3;
}
