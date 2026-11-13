import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { CatalogLibrary } from "@/components/mind/catalog-library";
import { getEducationCategory } from "@/lib/content/education-categories";
import { getCategoryContent, resolveRecommendationHref } from "@/lib/taxonomy/recommendations";
export const dynamic = "force-dynamic";

export default async function EducationCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { category: code } = await params;
  const category = getEducationCategory(code);
  if (!category) notFound();
  if (category.code !== code) redirect(`/mind/emotional-education/${category.code}`);
  const groups = await getCategoryContent({ categoryCode: category.code, userId: session.user.id });
  const items = groups.flatMap(group => group.items.map(item => ({
    ...item, href: resolveRecommendationHref(item), kindLabel: group.label,
    price: item.programId ? item.price : undefined,
    storageId: item.programId ? `program:${item.programId}` : item.externalKey,
  })));
  return <AppShell backHref="/mind/emotional-education" title={category.name} width="5xl">
    <div className="mb-6 rounded-2xl bg-[#eef5f9] px-5 py-5 sm:px-6 sm:py-6">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#6a889e]">Сэтгэлийн боловсрол</p>
      <h2 className="max-w-xl text-xl font-bold leading-snug text-[#234c68] sm:text-2xl">{category.question}</h2>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#6b8395]"><span>{items.length} агуулга</span><span>·</span><span>{items.filter(item => item.used).length} ашигласан</span></div>
    </div>
    <CatalogLibrary items={items}/>
  </AppShell>;
}
