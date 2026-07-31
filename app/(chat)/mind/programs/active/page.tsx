"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  AppCard,
  AppShell,
  Badge,
  Muted,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";

const BALANCE_PROGRAM = {
  title: "Амьдралын тэнцвэрээ ойлгох",
  description:
    "Үйлчлүүлэгч энэхүү хөтөлбөрийн үр дүнд өөрийн амьдралын тэнцвэрийн өнөөгийн байдлыг тодорхойлж ойлгоно. Ямар талбараас зугтааж, ямар талбарт хорогдоод байгаагаа олж харна.\n\nБусад талбартаа төдийлөн анхаарал хандуулалгүй, тухайн нэг талбарыг хэт анхаардаг байдлын цаана хүн амьдралынхаа явцад ямар ямар ур чадваруудыг хэт давуу хөгжүүлсэн бэ? Энэхүү хэт хөгжсөн ур чадвар нь амьдралд хэрхэн сайн болон муу байдлаар нөлөөлж байж болох вэ гэдгийг ажиглана.\n\nМөн амьдралдаа ямар ямар ур чадваруудыг хөгжүүлээгүй дутуу орхигдуулсан бэ? Үүний цаана ямар нөөц боломжууд байж болох вэ гэдгийг ажиглан судална.",
};

export default function ActiveProgramsPage() {
  return (
    <AppShell backHref="/" title="Сургалт (Хөтөлбөр)" width="4xl">
      <AppCard>
        <PageHero
          description="Өөрийгөө ойлгож, амьдралдаа хэрэгжүүлж болох сургалт, хөтөлбөрүүд"
          eyebrow={<Badge>Сургалтын жагсаалт</Badge>}
          icon="🎓"
          title="Сургалт, хөтөлбөрүүд"
        />

        <section
          className="mb-6 rounded-2xl border p-4 md:p-5"
          style={{
            background: "rgba(31,111,178,0.05)",
            borderColor: "rgba(31,111,178,0.18)",
          }}
        >
          <SectionHeading className="mb-3">
            {BALANCE_PROGRAM.title}
          </SectionHeading>
          {BALANCE_PROGRAM.description.split("\n\n").map((paragraph) => (
            <Muted className="mb-3 last:mb-0" key={paragraph}>
              {paragraph}
            </Muted>
          ))}
        </section>

        <SectionHeading className="mb-3">Сургалтын жагсаалт</SectionHeading>
        <Link
          className="group flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-slate-50"
          href="/mind/who-am-i/balance-test"
        >
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-xl"
            style={{
              background: "rgba(31,111,178,0.1)",
              color: "#1F6FB2",
            }}
          >
            <BookOpen className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-sm">
              {BALANCE_PROGRAM.title}
            </span>
            <span className="mt-1 block text-slate-500 text-xs">
              Өөрийгөө ойлгох үндсэн хөтөлбөр · Эхлэхэд бэлэн
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </AppCard>
    </AppShell>
  );
}
