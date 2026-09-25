import Link from "next/link";
import { getPublishedTrainings } from "@/lib/db/trainings";

export const dynamic = "force-dynamic";

export default async function TrainingsPage() {
  const trainings = await getPublishedTrainings();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#356A9A]">Сургалт</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Сургалтууд</h1>
      </div>
      {trainings.length === 0 ? (
        <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">Одоогоор нийтлэгдсэн сургалт алга.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trainings.map((training) => (
            <Link className="overflow-hidden rounded-2xl border bg-background transition hover:-translate-y-0.5 hover:shadow-md" href={"/mind/programs/" + training.slug} key={training.id}>
              <div className="bg-[#356A9A] p-5 text-white">
                <div className="flex items-center gap-2 text-xs text-white/80"><span>◯</span><span>Оюунсанаа</span><span className="ml-auto">аудио хичээл</span></div>
                <h2 className="mt-7 line-clamp-2 text-xl font-semibold leading-tight">{training.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/80">{training.summary}</p>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#E8F5F7] font-semibold text-[#356A9A]">
                  {training.authorAvatarUrl ? <img alt="" className="h-full w-full object-cover" src={training.authorAvatarUrl} /> : (training.authorName.charAt(0) || "О")}
                </div>
                <div className="min-w-0"><b className="block truncate text-sm">{training.authorName}</b><span className="block truncate text-xs text-muted-foreground">{training.authorSpecialty || "Оюунсанаа"}</span></div>
                <span className="ml-auto text-xs text-[#356A9A]">Нээх →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}