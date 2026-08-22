import taxonomyJson from "./taxonomy.json" with { type: "json" };

const WHITESPACE_SEQUENCE = /\s+/g;
const NON_WORD_SEQUENCE = /[^\p{L}\p{N}]+/u;

export type TaxonomyType = { name: string; tags: string[] };
export type TaxonomySubcategory = {
  code: string;
  name: string;
  types: TaxonomyType[];
};
export type TaxonomyCategory = {
  code: string;
  name: string;
  subcategories: TaxonomySubcategory[];
};
export type TaxonomyAssignment = {
  categoryCode: string;
  subcategoryCode: string;
  taxonomyType: string;
  primaryTagKey: string;
  additionalTagKeys: string[];
};

export const TAXONOMY = taxonomyJson as TaxonomyCategory[];

export function normalizeTagKey(value: string) {
  return value
    .normalize("NFC")
    .trim()
    .replace(WHITESPACE_SEQUENCE, " ")
    .toLocaleLowerCase("mn-MN");
}

const categoriesByCode = new Map(TAXONOMY.map((item) => [item.code, item]));
const subcategoriesByCode = new Map(
  TAXONOMY.flatMap((item) => item.subcategories).map((item) => [
    item.code,
    item,
  ])
);
const staticTagsByKey = new Map<string, { key: string; label: string }>();
for (const category of TAXONOMY) {
  for (const subcategory of category.subcategories) {
    for (const type of subcategory.types) {
      for (const label of type.tags) {
        const key = normalizeTagKey(label);
        if (!staticTagsByKey.has(key)) staticTagsByKey.set(key, { key, label });
      }
    }
  }
}

export function getCategory(code: string) {
  return categoriesByCode.get(code) ?? null;
}
export function getSubcategory(code: string) {
  return subcategoriesByCode.get(code) ?? null;
}
export function getTaxonomyType(subcategoryCode: string, name: string) {
  return (
    getSubcategory(subcategoryCode)?.types.find((item) => item.name === name) ??
    null
  );
}
export function getStaticTag(key: string) {
  return staticTagsByKey.get(key) ?? null;
}
export function isTaxonomyPathValid(
  value: Pick<
    TaxonomyAssignment,
    "categoryCode" | "subcategoryCode" | "taxonomyType"
  >
) {
  const category = getCategory(value.categoryCode);
  const subcategory = getSubcategory(value.subcategoryCode);
  return Boolean(
    category?.subcategories.some(
      (item) => item.code === value.subcategoryCode
    ) && subcategory?.types.some((item) => item.name === value.taxonomyType)
  );
}

const STOP_WORDS = new Set([
  "байна",
  "байх",
  "болон",
  "гэдэг",
  "тухай",
  "хэрхэн",
  "ямар",
  "миний",
  "надад",
  "өөрийн",
  "холбоотой",
  "хэрэгтэй",
  "болох",
  "хийх",
  "учир",
]);

function tokens(value: string) {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("mn-MN")
    .split(NON_WORD_SEQUENCE)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function tokensOverlap(left: string[], right: Set<string>) {
  let exact = 0;
  let stem = 0;
  for (const token of left) {
    if (right.has(token)) {
      exact += 1;
      continue;
    }
    const prefix = token.slice(0, 5);
    if (prefix.length === 5) {
      for (const candidate of right) {
        if (candidate.startsWith(prefix)) {
          stem += 1;
          break;
        }
      }
    }
  }
  return { exact, stem };
}

const inferenceCandidates = TAXONOMY.flatMap((category) =>
  category.subcategories.flatMap((subcategory) =>
    subcategory.types.flatMap((type) =>
      type.tags.map((label) => ({
        categoryCode: category.code,
        subcategoryCode: subcategory.code,
        taxonomyType: type.name,
        key: normalizeTagKey(label),
        labelTokens: tokens(label),
        typeTokens: tokens(type.name),
        subcategoryTokens: tokens(subcategory.name),
      }))
    )
  )
);

/** Deterministic fallback classification for chat text. It never writes a TAG. */
export function inferTaxonomyFromText(text: string): TaxonomyAssignment | null {
  const normalized = text.normalize("NFC").toLocaleLowerCase("mn-MN");
  const inputTokens = new Set(tokens(normalized));
  if (!normalized.trim()) return null;
  const matches: Array<{
    score: number;
    categoryCode: string;
    subcategoryCode: string;
    taxonomyType: string;
    key: string;
  }> = [];

  for (const candidate of inferenceCandidates) {
    const overlap = tokensOverlap(candidate.labelTokens, inputTokens);
    const typeOverlap = tokensOverlap(candidate.typeTokens, inputTokens);
    const subcategoryOverlap = tokensOverlap(
      candidate.subcategoryTokens,
      inputTokens
    );
    const exact =
      normalized === candidate.key ||
      ` ${normalized} `.includes(` ${candidate.key} `)
        ? 50
        : 0;
    const tagScore = exact + overlap.exact * 6 + overlap.stem * 3;
    const contextScore =
      typeOverlap.exact * 2 +
      typeOverlap.stem +
      subcategoryOverlap.exact +
      subcategoryOverlap.stem * 0.5;
    const score = tagScore * 100 + contextScore;
    if (tagScore > 0)
      matches.push({
        score,
        categoryCode: candidate.categoryCode,
        subcategoryCode: candidate.subcategoryCode,
        taxonomyType: candidate.taxonomyType,
        key: candidate.key,
      });
  }

  matches.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key, "mn"));
  const best = matches[0];
  if (!best) return null;
  const related = matches
    .filter(
      (item) =>
        item.subcategoryCode === best.subcategoryCode &&
        item.taxonomyType === best.taxonomyType &&
        item.key !== best.key
    )
    .map((item) => item.key)
    .filter((key, index, all) => all.indexOf(key) === index)
    .slice(0, 4);
  return {
    categoryCode: best.categoryCode,
    subcategoryCode: best.subcategoryCode,
    taxonomyType: best.taxonomyType,
    primaryTagKey: best.key,
    additionalTagKeys: related,
  };
}
