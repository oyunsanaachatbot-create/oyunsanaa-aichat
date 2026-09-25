import { notFound } from "next/navigation";
import { getPublishedTrainingBySlug } from "@/lib/db/trainings";

export const dynamic = "force-dynamic";

export default async function TrainingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const training = await getPublishedTrainingBySlug(slug);
  if (!training) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="space-y-5">
        {training.lessons.map((lesson, index) => (
          <section key={lesson.id}>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#356A9A] text-white">
              <div className="absolute left-[5.5%] top-[6%]">
                <div className="flex items-center gap-2 text-sm"><span className="text-lg">◯</span><b className="font-medium">Оюунсанаа</b></div>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">🎙</span>
                  <span className="text-xs leading-tight text-[#8EEAF0]">Оюунсанаа<br />аудио хичээл</span>
                  <div className="ml-2 flex h-8 items-center gap-[3px]" aria-hidden="true">
                    {[10,18,28,14,24,32,15,22,29,17,12,26,31,20,14,27].map((height, barIndex) => <i className="block w-[3px] rounded-full bg-white/90" key={barIndex} style={{ height }} />)}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-[23%] left-[6%] top-[32%] w-[54%]">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold tracking-[.08em]">ХИЧЭЭЛ {String(index + 1).padStart(2, "0")}</span>
                <h2 className="mt-3 line-clamp-3 text-[clamp(22px,4vw,48px)] font-semibold leading-[1.06] tracking-[-.01em]">{lesson.title || "Гарчиг"}</h2>
                <p className="mt-2 line-clamp-2 text-[clamp(12px,1.8vw,19px)] italic leading-snug text-white/90">{lesson.subtitle || "Товч утга"}</p>
              </div>
              <div className="absolute right-[6%] top-[19%] flex w-[27%] flex-col items-center text-center">
                <div className="aspect-square w-full overflow-hidden rounded-full border-[4px] border-white/95 bg-white/10">
                  {training.authorAvatarUrl ? <img alt="" className="h-full w-full object-cover" src={training.authorAvatarUrl} /> : <div className="grid h-full w-full place-items-center text-[clamp(34px,6vw,74px)] font-medium text-white/70">{training.authorName.charAt(0) || "О"}</div>}
                </div>
                <strong className="mt-2 max-w-full truncate text-sm font-semibold">{training.authorName}</strong>
                <span className="mt-0.5 max-w-full truncate text-[11px] text-white/70">{training.authorSpecialty || "Мэргэжил"}</span>
              </div>
              <div className="absolute bottom-[5%] left-[7%] right-[7%] line-clamp-2 min-h-11 rounded-2xl bg-[#173F59]/90 px-5 py-2 text-center text-[clamp(10px,1.3vw,14px)] leading-snug">
                {lesson.body ? lesson.body.split(/(?<=[.!?])/)[0] : "Уншиж байгаа өгүүлбэр энд гарна."}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}