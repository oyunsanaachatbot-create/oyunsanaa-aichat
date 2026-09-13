import taxonomyJson from "./taxonomy.json" with { type: "json" };
import professionalTaxonomyJson from "./professional-taxonomy.json" with { type: "json" };

const WHITESPACE_SEQUENCE = /\s+/g;
const NON_WORD_SEQUENCE = /[^\p{L}\p{N}]+/u;

export type TaxonomyType = { name: string; tags: string[] };
export type TaxonomySubcategory = {
  code: string;
  name: string;
  types: TaxonomyType[];
};
export type TaxonomyCategory = {
  group?: string;
  question?: string;
  code: string;
  name: string;
  subcategories: TaxonomySubcategory[];
};
export type ProfessionalTaxonomySubcategory = { code: string; name: string; tags: string[] };
export type ProfessionalTaxonomyCategory = { code: string; name: string; subcategories: ProfessionalTaxonomySubcategory[] };
export type TaxonomyAssignment = {
  categoryCode: string;
  subcategoryCode: string;
  taxonomyType: string;
  primaryTagKey: string;
  additionalTagKeys: string[];
};

// e/p codes keep this catalog separate from the old numeric category codes.
// Existing content keeps its stored assignment until an editor reclassifies it.
export const TAXONOMY = taxonomyJson as TaxonomyCategory[];
export const PROFESSIONAL_TAXONOMY = professionalTaxonomyJson as ProfessionalTaxonomyCategory[];
export const TAXONOMY_GROUPS = ["Сэтгэлийн боловсролоор"] as const;

const professionalPlacementsByTag = new Map<string, Array<{ categoryCode: string; subcategoryCode: string }>>();
for (const category of PROFESSIONAL_TAXONOMY) for (const subcategory of category.subcategories) for (const label of subcategory.tags) {
  const key = normalizeTagKey(label);
  const placements = professionalPlacementsByTag.get(key) ?? [];
  if (!placements.some((item) => item.categoryCode === category.code && item.subcategoryCode === subcategory.code)) placements.push({ categoryCode: category.code, subcategoryCode: subcategory.code });
  professionalPlacementsByTag.set(key, placements);
}

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
export function getProfessionalCategory(code: string) {
  return PROFESSIONAL_TAXONOMY.find((item) => item.code === code) ?? null;
}
export function getSubcategory(code: string) {
  return subcategoriesByCode.get(code) ?? null;
}
export function getProfessionalSubcategory(code: string) {
  return PROFESSIONAL_TAXONOMY.flatMap((item) => item.subcategories).find((item) => item.code === code) ?? null;
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
export function getStaticTagOptions(subcategoryCode: string, taxonomyType: string) {
  const type = getSubcategory(subcategoryCode)?.types.find((item) => item.name === taxonomyType);
  if (!type) return [];
  return [...new Map(type.tags.map((label) => [normalizeTagKey(label), { key: normalizeTagKey(label), label }])).values()];
}
export function getProfessionalTagOptions(subcategoryCode: string) {
  const subcategory = getProfessionalSubcategory(subcategoryCode);
  if (!subcategory) return [];
  return [...new Map(subcategory.tags.map((label) => [normalizeTagKey(label), { key: normalizeTagKey(label), label }])).values()];
}
export function getProfessionalPlacements(tagKey: string) {
  return professionalPlacementsByTag.get(normalizeTagKey(tagKey)) ?? [];
}
export function getAllStaticTagOptions() {
  return [...staticTagsByKey.values()].sort((a, b) => a.label.localeCompare(b.label, "mn"));
}
export function isTaxonomyPathValid(
  value: Pick<
    TaxonomyAssignment,
    "categoryCode" | "subcategoryCode" | "taxonomyType"
  >
) {
  if (value.categoryCode.startsWith("p")) {
    const category = getProfessionalCategory(value.categoryCode);
    const subcategory = getProfessionalSubcategory(value.subcategoryCode);
    return Boolean(category?.subcategories.some((item) => item.code === value.subcategoryCode) && subcategory?.name === value.taxonomyType);
  }
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
