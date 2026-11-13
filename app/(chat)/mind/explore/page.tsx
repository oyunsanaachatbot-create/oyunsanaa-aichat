import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { CatalogLibrary } from "@/components/mind/catalog-library";
import { PROFESSIONAL_TAXONOMY } from "@/lib/taxonomy";
import {
  getCategoryContent,
  resolveRecommendationHref,
} from "@/lib/taxonomy/recommendations";

export const dynamic = "force-dynamic";
const ages = [
  ["CHILD", "Хүүхэд (эцэг эх сонгоно)"],
  ["ADOLESCENT", "Өсвөр үе"],
  ["ADULT", "Насанд хүрэгчид"],
  ["SENIOR", "Ахмад настан"],
] as const;
const kinds = [
  ["TRAINING", "Сургалт"],
  ["PROGRAM", "Хөтөлбөр"],
  ["TEST", "Сэтгэлийн боловсрол"],
] as const;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const query = await searchParams;
  const scalar = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : "";
  const code = scalar("direction"),
    subject = scalar("subject"),
    age = scalar("age"),
    kind = scalar("kind");
  const direction = PROFESSIONAL_TAXONOMY.find((item) => item.code === code);
  if (
    (code && !direction) ||
    (subject &&
      !direction?.subcategories.some((item) => item.code === subject)) ||
    (age && !ages.some(([value]) => value === age)) ||
    (kind && !kinds.some(([value]) => value === kind))
  )
    notFound();
  const groups = direction
    ? await getCategoryContent({
        categoryCode: code,
        subcategoryCode: subject,
        audience: age,
        kind,
        userId: session.user.id,
      })
    : [];
  const items = groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      href: resolveRecommendationHref(item),
      kindLabel: group.label,
      storageId: item.programId
        ? `program:${item.programId}`
        : item.externalKey,
    }))
  );
  const field =
    "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm";
  return (
    <AppShell title="Экосистем" width="5xl">
      <nav
        aria-label="Үндсэн чиглэл"
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {PROFESSIONAL_TAXONOMY.map((item) => (
          <Link
            key={item.code}
            href={`/mind/explore?direction=${item.code}`}
            aria-current={item.code === code ? "page" : undefined}
            className={`flex min-h-16 items-center rounded-2xl border p-4 font-semibold text-sm ${item.code === code ? "border-blue-400 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:bg-sky-50"}`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      {direction ? (
        <>
          <h2 className="mb-4 font-semibold text-lg">{direction.name}</h2>
          <form
            action="/mind/explore"
            className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input type="hidden" name="direction" value={code} />
            <label className="space-y-1 text-sm">
              <span>Дэд ангилал</span>
              <select
                aria-label="Дэд ангилал"
                name="subject"
                defaultValue={subject}
                className={field}
              >
                <option value="">Бүх дэд ангилал</option>
                {direction.subcategories.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Насны бүлэг</span>
              <select
                aria-label="Насны бүлэг"
                name="age"
                defaultValue={age}
                className={field}
              >
                <option value="">Бүх нас</option>
                {ages.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Контентын төрөл</span>
              <select
                aria-label="Контентын төрөл"
                name="kind"
                defaultValue={kind}
                className={field}
              >
                <option value="">Бүх төрөл</option>
                {kinds.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="min-h-11 self-end rounded-xl bg-blue-700 px-4 py-3 font-semibold text-sm text-white"
            >
              Шүүх
            </button>
          </form>
          <CatalogLibrary
            key={[code, subject, age, kind].join(":")}
            items={items}
            emptyText="Таны сонгосон чиглэл, насанд тохирох нийтэлсэн контент одоогоор алга байна."
          />
        </>
      ) : (
        <p className="rounded-2xl bg-sky-50 p-5 text-slate-700 text-sm leading-6">
          Чиглэлээ сонгож сургалт, хөтөлбөр, сэтгэлийн боловсролын агуулгыг дэд
          ангилал болон насаар шүүн үзээрэй.
        </p>
      )}
    </AppShell>
  );
}
