import { ContentLibraryList } from "@/components/mind/content-library-list";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { getPublishedPrograms } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ActiveProgramsPage() {
  const programs = await getPublishedPrograms("PROGRAM");

  return (
    <AppShell backHref="/" title="Хөтөлбөрүүд" width="4xl">
      <AppCard>
        <PageHero
          description="Өөрийгөө ойлгож, амьдралдаа хэрэгжүүлж болох урт болон богино хугацааны хөтөлбөрүүд"
          icon="🎓"
        />

        <ContentLibraryList
          emptyText="Одоогоор нийтлэгдсэн хөтөлбөр алга байна."
          items={programs}
          kind="program"
        />
      </AppCard>
    </AppShell>
  );
}
