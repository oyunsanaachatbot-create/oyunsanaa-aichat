import { auth } from "@/app/(auth)/auth";
import { ContentLibraryList } from "@/components/mind/content-library-list";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { getActiveIndividualProgramIds, getPublishedPrograms } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ActiveProgramsPage() {
  const [programs, session] = await Promise.all([
    getPublishedPrograms("PROGRAM"),
    auth(),
  ]);
  const activeIds = session?.user?.id
    ? await getActiveIndividualProgramIds(session.user.id)
    : [];

  return (
    <AppShell backHref="/" title="Хөтөлбөрүүд" width="4xl">
      <AppCard>
        <PageHero
          description="Өөрийгөө ойлгож, амьдралдаа хэрэгжүүлж болох урт болон богино хугацааны хөтөлбөрүүд"
          icon="🎓"
        />

        <ContentLibraryList
          activeIds={activeIds}
          emptyText="Одоогоор нийтлэгдсэн хөтөлбөр алга байна."
          items={programs}
          kind="program"
        />
      </AppCard>
    </AppShell>
  );
}
