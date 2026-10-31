import previousTaxonomy from "./previous-taxonomy.json";
import { UNIFIED_TAXONOMY, UNIFIED_PROFESSIONAL_TAXONOMY, SEARCH_TAG_HINTS, ageTagLabels } from "./unified";
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

// New choices use one uploaded bank. Legacy JSON is read-only lookup for saved assignments.
export const TAXONOMY: TaxonomyCategory[] = UNIFIED_TAXONOMY;
export const PROFESSIONAL_TAXONOMY: ProfessionalTaxonomyCategory[] = UNIFIED_PROFESSIONAL_TAXONOMY;
export const TAXONOMY_GROUPS = ["Сэдвээр"] as const;

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

for (const row of SEARCH_TAG_HINTS) {
  const key = normalizeTagKey(row.label);
  if (!staticTagsByKey.has(key)) staticTagsByKey.set(key, { key, label: row.label });
}

export function getCategory(code: string) {
  return categoriesByCode.get(code) ?? (taxonomyJson as TaxonomyCategory[]).find(item => item.code === code) ?? null;
}
export function getProfessionalCategory(code: string) {
  return PROFESSIONAL_TAXONOMY.find((item) => item.code === code) ?? (professionalTaxonomyJson as ProfessionalTaxonomyCategory[]).find(item => item.code === code) ?? null;
}
export function getSubcategory(code: string) {
  const previous = previousTaxonomy.flatMap(item => item.subcategories).find(item => item.code === code);
  return subcategoriesByCode.get(code) ?? (previous ? { code: previous.code, name: previous.name, types: [{ name: previous.name, tags: previous.tags }] } : null) ?? (taxonomyJson as TaxonomyCategory[]).flatMap(item => item.subcategories).find(item => item.code === code) ?? null;
}
export function getProfessionalSubcategory(code: string) {
  return PROFESSIONAL_TAXONOMY.flatMap((item) => item.subcategories).find((item) => item.code === code) ?? previousTaxonomy.flatMap(item => item.subcategories).find(item => item.code === code) ?? (professionalTaxonomyJson as ProfessionalTaxonomyCategory[]).flatMap(item => item.subcategories).find(item => item.code === code) ?? null;
}
export function getTaxonomyType(subcategoryCode: string, name: string) {
  return (
    getSubcategory(subcategoryCode)?.types.find((item) => item.name === name) ??
    null
  );
}
export function getStaticTag(key: string) {
  const label = previousTaxonomy.flatMap(category => category.subcategories).flatMap(subcategory => subcategory.tags).find(label => normalizeTagKey(label) === key);
  return staticTagsByKey.get(key) ?? (label ? { key, label } : null);
}
export function getStaticTagOptions(subcategoryCode: string, taxonomyType: string) {
  const type = getSubcategory(subcategoryCode)?.types.find((item) => item.name === taxonomyType);
  if (!type) return [];
  return [...new Map(type.tags.map((label) => [normalizeTagKey(label), { key: normalizeTagKey(label), label }])).values()];
}
export function getProfessionalTagOptions(subcategoryCode: string, audiences?: readonly string[]) {
  const subcategory = getProfessionalSubcategory(subcategoryCode);
  if (!subcategory) return [];
  return [...new Map((ageTagLabels(audiences, subcategoryCode) ?? subcategory.tags).map((label) => [normalizeTagKey(label), { key: normalizeTagKey(label), label }])).values()];
}
export function getProfessionalPlacements(tagKey: string) {
  return professionalPlacementsByTag.get(normalizeTagKey(tagKey)) ?? [];
}
export function getAllStaticTagOptions(audiences?: readonly string[]) {
  const labels = ageTagLabels(audiences);
  if (labels) return labels.map(label => ({ key: normalizeTagKey(label), label })).sort((a,b) => a.label.localeCompare(b.label, "mn"));
  return [...staticTagsByKey.values()].sort((a, b) => a.label.localeCompare(b.label, "mn"));
}
export function isTaxonomyPathValid(
  value: Pick<
    TaxonomyAssignment,
    "categoryCode" | "subcategoryCode" | "taxonomyType"
  >
) {
  if (value.categoryCode.startsWith("p")) {
    const category = value.subcategoryCode.includes("n") ? (PROFESSIONAL_TAXONOMY.find(category => category.subcategories.some(subcategory => subcategory.code === value.subcategoryCode)) ?? previousTaxonomy.find(category => category.subcategories.some(subcategory => subcategory.code === value.subcategoryCode))) : (professionalTaxonomyJson as ProfessionalTaxonomyCategory[]).find(item => item.code === value.categoryCode);
    const subcategory = getProfessionalSubcategory(value.subcategoryCode);
    return Boolean(category?.code === value.categoryCode && category.subcategories.some((item) => item.code === value.subcategoryCode) && subcategory?.name === value.taxonomyType);
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

/** An omitted website subject is valid; a partially filled subject is not. */
export function hasTaxonomyAssignment(value?: TaxonomyAssignment | null) {
  return Boolean(value && (value.categoryCode || value.subcategoryCode || value.taxonomyType || value.primaryTagKey || value.additionalTagKeys.length));
}
