import "server-only";

import { getSql } from "@/lib/db/pgClient";
import { inferTaxonomyFromText, type TaxonomyAssignment } from "@/lib/taxonomy";

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
  used: boolean;
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

/** Browse every active content item in one of the eight main education categories. */
export async function getCategoryContent({
  categoryCode,
  userId,
}: {
  categoryCode: string;
  userId: string;
}): Promise<RecommendationGroup[]> {
  const db = getSql();
  if (!db) return [];

  const rows = await db<RecommendationItem[]>`
    SELECT
      item.id,
      item."externalKey",
      item."sourceApp",
      item.kind,
      item.title,
      item.summary,
      item.href,
      EXISTS (
        SELECT 1 FROM "ContentUsage" usage
        WHERE usage."contentItemId" = item.id AND usage."userId" = ${userId}
      ) AS used
    FROM "ContentCatalogItem" item
    WHERE item.status = 'ACTIVE'
      AND item."categoryCode" = ${categoryCode}
    ORDER BY item."createdAt" ASC, item.id ASC
    LIMIT 500
  `;

  return groupContentItems(rows);
}

function tagKeysOf(taxonomy: TaxonomyAssignment) {
  return [
    ...new Set(
      [taxonomy.primaryTagKey, ...taxonomy.additionalTagKeys].filter(Boolean)
    ),
  ].slice(0, 5);
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
      EXISTS (
        SELECT 1 FROM "ContentUsage" usage
        WHERE usage."contentItemId" = item.id AND usage."userId" = ${userId}
      ) AS used
    FROM "ContentCatalogItem" item
    WHERE item.status = 'ACTIVE'
      AND (${excludeExternalKey ?? null}::text IS NULL OR item."externalKey" <> ${excludeExternalKey ?? null})
      AND (
        item."primaryTagKey" = ANY(${db.array(keys)}::text[])
        OR item."additionalTagKeys" && ${db.array(keys)}::text[]
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
