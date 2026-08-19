import { ContentLibraryList } from "@/components/mind/content-library-list";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { getPublishedPrograms } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const trainings = await getPublishedPrograms("TRAINING");

  return (
    <AppShell backHref="/" title="Сургалт" width="4xl">
      <AppCard>
        <PageHero
          description="Вебинар, лекц, семинар болон богино сургалтууд"
          icon="📚"
        />
        <ContentLibraryList
          emptyText="Одоогоор нийтлэгдсэн сургалт алга байна."
          items={trainings}
          kind="training"
        />
      </AppCard>
    </AppShell>
  );
}
