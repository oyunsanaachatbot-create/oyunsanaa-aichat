import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { EDUCATION_CATEGORIES } from "@/lib/content/education-categories";
import {
  getCategoryContent,
  resolveRecommendationHref,
} from "@/lib/taxonomy/recommendations";

export const dynamic = "force-dynamic";

export default async function EducationCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { category: categoryCode } = await params;
  const category = EDUCATION_CATEGORIES.find(
    (item) => item.code === categoryCode
  );
  if (!category) notFound();

  const groups = await getCategoryContent({
    categoryCode,
    userId: session.user.id,
  });
  const itemCount = groups.reduce(
    (total, group) => total + group.items.length,
    0
  );

  return (
    <AppShell
      backHref="/mind/emotional-education"
      title={`${category.code}. ${category.name}`}
      width="4xl"
    >
      <AppCard>
        <PageHero
          description={category.question}
          icon={category.code}
          title="Энэ ангиллын бүх агуулга"
        />

        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-blue-900 text-sm">
          <Layers3 className="size-4" />
          <b>{itemCount} хөтөлбөр</b>
          <span className="text-blue-700">· Энэ ангилалд хамаарах нийтлэгдсэн хөтөлбөрүүд</span>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 border-dashed px-5 py-12 text-center">
            <p className="font-semibold text-slate-700">
              Энэ ангилалд нийтлэгдсэн хөтөлбөр одоогоор алга байна.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-1 font-semibold text-blue-700 text-sm hover:underline"
              href="/mind/emotional-education"
            >
              Бусад ангиллыг харах <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.kind}>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <h2 className="font-bold text-lg text-slate-900">
                    {group.label}
                  </h2>
                  <span className="text-slate-500 text-xs">
                    {group.items.length} агуулга
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const href = resolveRecommendationHref(item);
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <b className="text-slate-900 text-sm leading-5">
                            {item.title}
                          </b>
                          {item.used && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-[10px] text-emerald-700">
                              <CheckCircle2 className="size-3" /> Үзсэн
                            </span>
                          )}
                        </div>
                        {item.summary && (
                          <p className="mt-2 line-clamp-3 text-slate-600 text-xs leading-5">
                            {item.summary}
                          </p>
                        )}
                        <span className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-700 text-xs">
                          Нээх <ArrowRight className="size-3.5" />
                        </span>
                      </>
                    );
                    const className =
                      "group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30";
                    return href.startsWith("http") ? (
                      <a
                        className={className}
                        href={href}
                        key={item.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {content}
                      </a>
                    ) : (
                      <Link className={className} href={href} key={item.id}>
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </AppCard>
    </AppShell>
  );
}
