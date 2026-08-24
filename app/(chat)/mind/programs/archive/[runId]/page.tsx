import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/app/(auth)/auth";
import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";
import { AutomaticContentRecommendations } from "@/components/content-recommendations";
import { getCompletedProgramRunById } from "@/lib/db/queries";
import {
  resolveResultTaxonomy,
  responseKey,
  taskResponseKey,
  type ProgramResultBand,
} from "@/lib/programs/definition";

export const dynamic = "force-dynamic";

function answerText(
  value: unknown,
  options: Array<{ id: string; label: string }>
) {
  if (Array.isArray(value)) {
    return value
      .map(
        (item) =>
          options.find((option) => option.id === item)?.label ?? String(item)
      )
      .join(", ");
  }
  if (typeof value === "boolean") return value ? "Хийсэн" : "Хийгээгүй";
  if (typeof value === "string") {
    return options.find((option) => option.id === value)?.label ?? value;
  }
  return value === undefined || value === null ? "—" : String(value);
}

export default async function ProgramArchiveResultPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { runId } = await params;
  const data = await getCompletedProgramRunById({
    id: runId,
    userId: session.user.id,
  });
  if (!data) notFound();

  const responses = data.run.responses as Record<string, unknown>;
  const result = data.run.result as {
    percent?: number;
    earned?: number;
    maximum?: number;
    band?: Partial<ProgramResultBand>;
  };
  const resultSection = data.definition.sections.find(
    (section) => section.type === "RESULT"
  );
  const resultBand = result.band?.id
    ? resultSection?.resultBands.find((band) => band.id === result.band?.id)
    : undefined;
  const resultRecommendations = resultBand?.recommendations?.length
    ? resultBand.recommendations
    : (resultSection?.recommendations ?? []);
  const resultTaxonomy = resolveResultTaxonomy(
    resultBand ?? (result.band as ProgramResultBand | undefined),
    data.definition.taxonomy
  );

  return (
    <AppShell
      backHref="/mind/programs/archive"
      title={data.definition.title}
      width="4xl"
    >
      <div className="space-y-5">
        <AppCard>
          <PageHero
            description={data.definition.summary}
            eyebrow={<Badge>Дууссан · v{data.version}</Badge>}
            icon={data.definition.icon}
            title="Хөтөлбөрийн үр дүн"
          />
          {typeof result.percent === "number" && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
              <div className="font-extrabold text-4xl text-blue-700">
                {result.percent}%
              </div>
              {typeof result.earned === "number" &&
                typeof result.maximum === "number" && (
                  <p className="mt-1 text-slate-500 text-sm">
                    {result.earned}/{result.maximum} оноо
                  </p>
                )}
            </div>
          )}
          {result.band?.title && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <SectionHeading>{result.band.title}</SectionHeading>
              {result.band.body && (
                <p className="mt-2 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                  {result.band.body}
                </p>
              )}
            </div>
          )}
          {resultTaxonomy && (
            <AutomaticContentRecommendations
              excludeExternalKey={`program-run:${data.run.id}`}
              taxonomy={resultTaxonomy}
            />
          )}
          {resultRecommendations.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <SectionHeading>Зөвлөмж</SectionHeading>
              <div className="mt-3 space-y-3">
                {resultRecommendations.map((recommendation) => (
                  <div
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-blue-50/40 p-3"
                    key={recommendation.id}
                  >
                    <div className="min-w-0">
                      <b className="block text-sm">{recommendation.title}</b>
                      <span className="mt-1 block text-slate-600 text-xs">
                        {recommendation.note}
                      </span>
                    </div>
                    <Link
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      href={recommendation.href}
                    >
                      Нээх
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AppCard>

        {data.definition.sections.map((section) => {
          const hasContent =
            section.questions.length > 0 || section.tasks.length > 0;
          if (!hasContent) return null;
          return (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-4"
              key={section.id}
            >
              <SectionHeading>{section.title}</SectionHeading>
              <div className="mt-3 space-y-4">
                {section.questions.map((question) => (
                  <div key={question.id}>
                    <div className="text-slate-500 text-xs">
                      {question.prompt}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {answerText(
                        responses[responseKey(section.id, question.id)],
                        question.options
                      )}
                    </p>
                  </div>
                ))}
                {section.tasks.map((task) => (
                  <div key={task.id}>
                    <div className="text-slate-500 text-xs">{task.title}</div>
                    <p className="mt-1 text-sm">
                      {Array.from(
                        { length: section.repeatDays },
                        (_, index) => index + 1
                      )
                        .map(
                          (day) =>
                            `${day}-р өдөр: ${answerText(
                              responses[
                                taskResponseKey(section.id, task.id, day)
                              ],
                              []
                            )}`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
