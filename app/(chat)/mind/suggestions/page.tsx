import Link from "next/link";
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
  searchParams: Promise<{ kind?: string; taxonomy?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const params = await searchParams;
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

  return (
    <AppShell
      backHref="/"
      subtitle="Ижил TAG-тай контентыг анх бүртгэсэн дарааллаар харуулна."
      title="Холбоотой контент"
      width="4xl"
    >
      <div className="space-y-8">
        {groups.length === 0 && (
          <p className="rounded-2xl bg-slate-50 px-6 py-12 text-center text-slate-500">
            Холбоотой контент олдсонгүй.
          </p>
        )}
        {groups.map((group) => (
          <section key={group.kind}>
            <h2 className="font-bold text-lg text-slate-900">{group.label}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => {
                const href = resolveRecommendationHref(item);
                const card = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <b>{item.title}</b>
                      {item.used && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                          Өмнө ашигласан
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <p className="mt-2 text-slate-600 text-sm leading-6">
                        {item.summary}
                      </p>
                    )}
                    <span className="mt-3 inline-block font-semibold text-blue-700 text-sm">
                      Нээх →
                    </span>
                  </>
                );
                return href.startsWith("http") ? (
                  <a
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-200"
                    href={href}
                    key={item.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {card}
                  </a>
                ) : (
                  <Link
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-200"
                    href={href}
                    key={item.id}
                  >
                    {card}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
