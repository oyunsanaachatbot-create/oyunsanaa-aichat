import { getEducationCategory } from "@/lib/content/education-categories";
import "server-only";

import { getSql } from "@/lib/db/pgClient";
import { getCategory, getStaticTagOptions, inferTaxonomyFromText, type TaxonomyAssignment } from "@/lib/taxonomy";

const HTTPS_URL = /^https:\/\//;
const TRAILING_SLASH = /\/$/;

export const CONTENT_KIND_ORDER = [
  "PROGRAM",
  "TRAINING",
  "TEST",
  "RESEARCH",
  "ARTICLE",
  "NOTE",
  "FINANCE",
  "HEALTH",
  "SPECIALIST",
] as const;
export type ContentKind = (typeof CONTENT_KIND_ORDER)[number];
export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  PROGRAM: "Хөтөлбөр",
  TRAINING: "Сургалт",
  TEST: "Тест",
  RESEARCH: "Судалгаа",
  ARTICLE: "Нийтлэл",
  NOTE: "Тэмдэглэл",
  FINANCE: "Санхүү",
  HEALTH: "Эрүүл мэнд",
  SPECIALIST: "Мэргэжилтэн",
};

export type RecommendationItem = {
  id: string;
  externalKey: string;
  sourceApp: "WEB" | "AICHAT";
  kind: ContentKind;
  title: string;
  summary: string | null;
  href: string;
  price: number;
  used: boolean;
  imageUrl?: string | null;
  programId?: string | null;
};
export type RecommendationGroup = {
  kind: ContentKind;
  label: string;
  items: RecommendationItem[];
};

function groupContentItems(rows: RecommendationItem[]) {
  return CONTENT_KIND_ORDER.flatMap((kind) => {
    const items = rows.filter((item) => item.kind === kind);
    return items.length > 0
      ? [{ kind, label: CONTENT_KIND_LABELS[kind], items }]
      : [];
  });
}

/** The existing platform publisher supplies all published content kinds for this direction. */
export async function getCategoryContent({
  categoryCode,
  userId,
}: {
  categoryCode: string;
  userId: string;
}): Promise<RecommendationGroup[]> {
  const db = getSql();
  if (!db) return [];
  const section = getEducationCategory(categoryCode);
  const categoryCodes = section ? [section.code, ...section.legacyCodes] : [categoryCode];
  const category = getCategory(section?.code ?? categoryCode);
  const tagKeys = category
    ? [...new Set(category.subcategories.flatMap((subcategory) => subcategory.types.flatMap((type) => getStaticTagOptions(subcategory.code, type.name).map((tag) => tag.key))))]
    : [];

  const rows = await db<RecommendationItem[]>`
    SELECT
      item.id,
      item."externalKey",
      item."sourceApp",
      item.kind,
      item.title,
      item.summary,
      item.href,
      program.id AS "programId",
      (SELECT COALESCE(NULLIF(version.definition->>'coverImageUrl', ''), NULLIF(version.definition->>'imageUrl', ''))
       FROM "ProgramVersion" version WHERE version."programId" = program.id AND version.status = 'PUBLISHED'
       ORDER BY version.version DESC LIMIT 1) AS "imageUrl",
      COALESCE(program.price, 0)::int AS price,
      EXISTS (
        SELECT 1 FROM "ContentUsage" usage
        WHERE usage."contentItemId" = item.id AND usage."userId" = ${userId}
      ) AS used
    FROM "ContentCatalogItem" item
    JOIN "Program" program ON program."catalogItemId" = item.id
    WHERE item.status = 'ACTIVE'
      AND program.status = 'PUBLISHED'
      AND program.audience = 'INDIVIDUAL'
      AND (
        item."categoryCode" = ANY(ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(categoryCodes)}::jsonb)))
        OR item."primaryTagKey" = ANY(ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(tagKeys)}::jsonb)))
        OR item."additionalTagKeys" && ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(tagKeys)}::jsonb))
      )
    ORDER BY item."createdAt" ASC, item.id ASC
    LIMIT 500
  `;

  return groupContentItems(rows);
}

function tagKeysOf(taxonomy: TaxonomyAssignment) {
  return [...new Set([taxonomy.primaryTagKey, ...taxonomy.additionalTagKeys].filter(Boolean))];
}

export async function getContentRecommendations({
  excludeExternalKey,
  taxonomy,
  text,
  userId,
}: {
  excludeExternalKey?: string;
  taxonomy?: TaxonomyAssignment | null;
  text?: string;
  userId: string;
}): Promise<{
  taxonomy: TaxonomyAssignment | null;
  groups: RecommendationGroup[];
}> {
  const resolvedTaxonomy = taxonomy ?? inferTaxonomyFromText(text ?? "");
  if (!resolvedTaxonomy) return { taxonomy: null, groups: [] };
  const keys = tagKeysOf(resolvedTaxonomy);
  if (keys.length === 0) return { taxonomy: resolvedTaxonomy, groups: [] };
  const db = getSql();
  if (!db) return { taxonomy: resolvedTaxonomy, groups: [] };

  const rows = await db<RecommendationItem[]>`
    SELECT
      item.id,
      item."externalKey",
      item."sourceApp",
      item.kind,
      item.title,
      item.summary,
      item.href,
      program.id AS "programId",
      (SELECT COALESCE(NULLIF(version.definition->>'coverImageUrl', ''), NULLIF(version.definition->>'imageUrl', ''))
       FROM "ProgramVersion" version WHERE version."programId" = program.id AND version.status = 'PUBLISHED'
       ORDER BY version.version DESC LIMIT 1) AS "imageUrl",
      COALESCE(program.price, 0)::int AS price,
      EXISTS (
        SELECT 1 FROM "ContentUsage" usage
        WHERE usage."contentItemId" = item.id AND usage."userId" = ${userId}
      ) AS used
    FROM "ContentCatalogItem" item
    LEFT JOIN "Program" program ON program."catalogItemId" = item.id
    WHERE item.status = 'ACTIVE'
      AND (program.id IS NULL OR (program.status = 'PUBLISHED' AND program.audience = 'INDIVIDUAL'))
      AND (${excludeExternalKey ?? null}::text IS NULL OR item."externalKey" <> ${excludeExternalKey ?? null})
      AND (
        item."primaryTagKey" = ANY(ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(keys)}::jsonb)))
        OR item."additionalTagKeys" && ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(keys)}::jsonb))
      )
    ORDER BY item."createdAt" ASC, item.id ASC
    LIMIT 300
  `;

  const groups = groupContentItems(rows);
  return { taxonomy: resolvedTaxonomy, groups };
}

export function resolveRecommendationHref(
  item: Pick<RecommendationItem, "sourceApp" | "href">
) {
  if (item.sourceApp === "AICHAT" || HTTPS_URL.test(item.href))
    return item.href;
  const base = (process.env.MARKETING_URL ?? "https://oyunsanaa.com").replace(
    TRAILING_SLASH,
    ""
  );
  return `${base}${item.href.startsWith("/") ? item.href : `/${item.href}`}`;
}

export async function recordContentUsage({
  completed = false,
  externalKey,
  sourceId,
  sourceType,
  state,
  userId,
}: {
  completed?: boolean;
  externalKey?: string;
  sourceId?: string;
  sourceType?: string;
  state: "VIEWED" | "STARTED" | "COMPLETED";
  userId: string;
}) {
  const db = getSql();
  if (!db || (!externalKey && !sourceId)) return;
  await db`
    INSERT INTO "ContentUsage" ("userId", "contentItemId", state, "completedAt")
    SELECT ${userId}::uuid, item.id, ${state}, ${completed || state === "COMPLETED" ? new Date() : null}
    FROM "ContentCatalogItem" item
    WHERE (${externalKey ?? null}::text IS NOT NULL AND item."externalKey" = ${externalKey ?? null})
       OR (
         ${sourceId ?? null}::text IS NOT NULL
         AND item."sourceId" = ${sourceId ?? null}
         AND (${sourceType ?? null}::text IS NULL OR item."sourceType" = ${sourceType ?? null})
       )
    LIMIT 1
    ON CONFLICT ("userId", "contentItemId") DO UPDATE SET
      state = CASE
        WHEN "ContentUsage".state = 'COMPLETED' THEN 'COMPLETED'
        WHEN "ContentUsage".state = 'STARTED' AND EXCLUDED.state = 'VIEWED' THEN 'STARTED'
        ELSE EXCLUDED.state
      END,
      "lastUsedAt" = now(),
      "completedAt" = COALESCE("ContentUsage"."completedAt", EXCLUDED."completedAt")
  `;
}
