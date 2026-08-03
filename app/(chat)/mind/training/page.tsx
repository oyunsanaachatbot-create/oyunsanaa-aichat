import { BookOpen, CalendarDays, Video } from "lucide-react";
import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
} from "@/components/mind/app-shell";

const TRAINING_TYPES = [
  { icon: Video, title: "Онлайн сургалт", detail: "Цахим сургалт, вебинар" },
  {
    icon: BookOpen,
    title: "Лекц, семинар",
    detail: "Мэдлэг, ур чадварын сургалт",
  },
  {
    icon: CalendarDays,
    title: "Удахгүй болох сургалт",
    detail: "Шинэ хуваарь энд нэмэгдэнэ",
  },
];

export default function TrainingPage() {
  return (
    <AppShell backHref="/" title="Сургалт" width="4xl">
      <AppCard>
        <PageHero
          description="Вебинар, лекц, семинар болон богино сургалтууд хөтөлбөрөөс тусдаа энд байрлана."
          eyebrow={<Badge>Сургалт</Badge>}
          icon="🎓"
          title="Сургалтууд"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {TRAINING_TYPES.map(({ icon: Icon, title, detail }) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-4"
              key={title}
            >
              <Icon className="size-5 text-[#1F6FB2]" />
              <h2 className="mt-3 font-semibold text-slate-900 text-sm">
                {title}
              </h2>
              <p className="mt-1 text-slate-500 text-sm leading-relaxed">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </AppCard>
    </AppShell>
  );
}
