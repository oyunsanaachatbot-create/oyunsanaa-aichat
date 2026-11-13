import { CatalogLibrary } from "@/components/mind/catalog-library";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { taxonomyAssignmentSchema } from "@/lib/taxonomy/schema";
import type { TaxonomyAssignment } from "@/lib/taxonomy";
import {
  CONTENT_KIND_ORDER,
  getContentRecommendations,
  resolveRecommendationHref,
  type ContentKind,
} from "@/lib/taxonomy/recommendations";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; source?: string; taxonomy?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const params = await searchParams;
  if (params.source !== "result") redirect("/mind/emotional-education");
  let taxonomy: TaxonomyAssignment | null = null;
  try {
    taxonomy = taxonomyAssignmentSchema.parse(
      JSON.parse(params.taxonomy ?? "null")
    );
  } catch {
    /* invalid query produces an empty result */
  }
  const result = await getContentRecommendations({
    taxonomy,
    userId: session.user.id,
  });
  const kind = CONTENT_KIND_ORDER.includes(params.kind as ContentKind)
    ? (params.kind as ContentKind)
    : null;
  const groups = kind
    ? result.groups.filter((group) => group.kind === kind)
    : result.groups;

  const items = groups.flatMap(group => group.items.map(item => ({
    ...item, href: resolveRecommendationHref(item), kindLabel: group.label,
    price: item.programId ? item.price : undefined,
    storageId: item.programId ? `program:${item.programId}` : item.externalKey,
  })));
  return (
    <AppShell backHref="/mind/emotional-education" title="Танд тохирох агуулга" subtitle="Дүгнэлтийн сэдэвтэй холбоотой агуулгуудаас сонгоорой." width="5xl">
      <CatalogLibrary items={items} emptyText="Таны үр дүнд тохирох контент одоогоор олдсонгүй."/>
    </AppShell>
  );
}
