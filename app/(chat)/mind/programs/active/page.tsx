"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";

const BALANCE_PROGRAM = {
  title: "Амьдралын тэнцвэрээ ойлгох",
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
