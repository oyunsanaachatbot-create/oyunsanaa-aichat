import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import {
  ensureUserIdByEmail,
  getPublishedOrganizationPrograms,
} from "@/lib/db/queries";
import {
  getDirectorOrganizationSummary,
  resolveOrganizationEntitlements,
} from "@/lib/organizations/access";

export const dynamic = "force-dynamic";
const TRAILING_SLASH = /\/$/;

export default async function OrganizationPage() {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest")
    redirect("/login?callbackUrl=/mind/organization");
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) redirect("/");
  const programs = await getPublishedOrganizationPrograms(
    access.membership.organizationRole
  );
  const directorSummary =
    access.membership.organizationRole === "DIRECTOR"
      ? await getDirectorOrganizationSummary(
          access.organization.id,
          access.contract.id
        )
      : null;
  const marketingUrl = (
    process.env.MARKETING_URL ?? "https://oyunsanaa.com"
  ).replace(TRAILING_SLASH, "");
  return (
    <AppShell backHref="/" title="Байгууллага" width="5xl">
      <div className="space-y-6">
        <AppCard>
          <PageHero
            description={`${access.organization.name} · ${access.membership.organizationRole}`}
            icon="🏢"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat
              label="Уулзалтын үлдсэн эрх"
              value={Number(access.sessionStats.available)}
            />
            <Stat
              label="Захиалсан уулзалт"
              value={Number(access.sessionStats.reserved)}
            />
            <Stat
              label="AI Chat эрх"
              value={
                access.chatGrant
                  ? `Идэвхтэй · ${access.chatGrant.endsAt.toLocaleDateString("mn-MN")}`
                  : "Олгогдоогүй"
              }
            />
          </div>
          {Number(access.sessionStats.available) > 0 && (
            <Link
              className="mt-5 inline-flex rounded-xl bg-[#1F6FB2] px-4 py-2.5 font-semibold text-sm text-white"
              href={`${marketingUrl}/book?funding=organization`}
            >
              Сэтгэлзүйчээс цаг авах
            </Link>
          )}
        </AppCard>
        <AppCard>
          <h2 className="font-bold text-xl">
            Танд зориулсан хөтөлбөр, сургалт
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Таны байгууллагын role-той яг таарсан контент.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {programs.map((program) => (
              <Link
                className="rounded-2xl border p-5 transition hover:border-[#1F6FB2] hover:bg-muted/30"
                href={`/mind/programs/${program.slug}`}
                key={program.id}
              >
                <span className="text-2xl">{program.definition.icon}</span>
                <h3 className="mt-3 font-semibold">
                  {program.definition.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                  {program.definition.summary}
                </p>
              </Link>
            ))}
            {programs.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Одоогоор нийтлэгдсэн контент алга байна.
              </p>
            )}
          </div>
        </AppCard>
        {directorSummary && (
          <AppCard>
            <h2 className="font-bold text-xl">Байгууллагын нийлбэр тайлан</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Зөвхөн нийлбэр тоо. Ажилтны хариулт, дүгнэлт, тэмдэглэл, уулзалтын
              мэдээлэл агуулаагүй.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Идэвхтэй гишүүн"
                value={directorSummary.activeMembers}
              />
              <Stat
                label="Эхэлсэн хөтөлбөр"
                value={directorSummary.programRunsStarted}
              />
              <Stat
                label="Дууссан хөтөлбөр"
                value={directorSummary.programRunsCompleted}
              />
              <Stat
                label="Уулзалт ашигласан / үлдсэн"
                value={`${directorSummary.sessionCredits.used} / ${directorSummary.sessionCredits.available}`}
              />
              <Stat
                label="AI эрх оноосон / идэвхтэй"
                value={`${directorSummary.aiChatGrants.total} / ${directorSummary.aiChatGrants.active}`}
              />
            </div>
          </AppCard>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-bold text-lg">{value}</p>
    </div>
  );
}
