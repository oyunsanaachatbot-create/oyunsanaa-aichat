"use client";

import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell, Badge, PageHero } from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";

const SECTION_ORDER = [
  "world",
  "memories",
  "notes",
  "happy",
  "letters",
  "difficult",
  "wisdom",
  "complaints",
  "creatives",
  "personals",
] as const;

export default function EbookHome() {
  const t = useT();
  const eb = t.apps.ebooks;
  const sections = eb.sections as Record<
    string,
    { title: string; sub?: string }
  >;

  return (
    <AppShell
      actions={
        <Link
          className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 font-medium text-slate-600 text-xs transition hover:border-[#1F6FB2]/30 hover:bg-blue-50 hover:text-[#1F6FB2] sm:inline-flex"
          href="/mind/ebooks/extras"
        >
          <Sparkles className="size-3.5" />
          {eb.sections.extras.title}
        </Link>
      }
      subtitle={eb.subtitle}
      title={eb.title}
      width="4xl"
    >
      <div className="space-y-6 font-sans">
        <PageHero
          description="Өөртөө үнэнчээр бичиж, бодол мэдрэмжээ нэг дор хадгалаарай. Ангиллаа сонгоод шууд тэмдэглэлээ эхлүүлнэ."
          eyebrow={<Badge>Миний тэмдэглэл</Badge>}
          icon="📖"
          title="Бичих ангиллаа сонгох"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {SECTION_ORDER.map((sectionId, index) => {
            const section = sections[sectionId];
            return (
              <Link
                className="group hover:-translate-y-0.5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1F6FB2]/30 hover:shadow-md"
                href={`/mind/ebooks/${sectionId}`}
                key={sectionId}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1F6FB2] transition group-hover:bg-[#1F6FB2] group-hover:text-white">
                  <BookOpen className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">
                    {index + 1}. {section?.title ?? sectionId}
                  </span>
                  <span className="mt-1 block text-slate-500 text-xs">
                    {section?.sub ?? "Бодол, мэдрэмжээ тэмдэглэх"}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1F6FB2]" />
              </Link>
            );
          })}
        </div>

        <Link
          className="flex items-center gap-3 rounded-2xl border border-slate-300 border-dashed bg-slate-50/70 p-4 transition hover:border-[#1F6FB2]/40 hover:bg-blue-50/50"
          href="/mind/ebooks/extras"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#1F6FB2] shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-900">
              {eb.sections.extras.title}
            </span>
            <span className="mt-1 block text-slate-500 text-xs">
              Номын нүүр, агуулга болон нэмэлт хэсгүүдээ тохируулах
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-400" />
        </Link>
      </div>
    </AppShell>
  );
}
