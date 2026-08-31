"use client";

import {
  Archive,
  BookOpen,
  ChevronRight,
  Clock,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EDUCATION_CATEGORIES } from "@/lib/content/education-categories";

type LibraryItem = {
  id: string;
  slug: string;
  renderer: "BUILDER" | "LEGACY";
  legacyKey: string | null;
  price: number;
  definition: {
    title: string;
    summary: string;
    icon: string;
    estimatedMinutes?: number;
    taxonomy?: { categoryCode?: string };
  };
};

const LEGACY_PROGRAM_ROUTES: Record<string, string> = {
  "life-balance-v1": "/mind/who-am-i/balance-test",
};

export function ContentLibraryList({
  archiveHref = "/mind/programs/archive",
  emptyText,
  items,
  kind,
}: {
  archiveHref?: string;
  emptyText: string;
  items: LibraryItem[];
  kind: "program" | "training";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("mn-MN");
    return items.filter((item) => {
      const matchesCategory =
        category === "all" ||
        item.definition.taxonomy?.categoryCode === category;
      const searchable = `${item.definition.title} ${item.definition.summary}`
        .normalize("NFC")
        .toLocaleLowerCase("mn-MN");
      return (
        matchesCategory &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [category, items, query]);

  const itemHref = (item: LibraryItem) => {
    const legacyHref = item.legacyKey
      ? LEGACY_PROGRAM_ROUTES[item.legacyKey]
      : null;
    return item.renderer === "LEGACY" && legacyHref
      ? legacyHref
      : `/mind/programs/${item.slug}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
        <label className="relative block">
          <span className="sr-only">
            {kind === "program" ? "Хөтөлбөр хайх" : "Сургалт хайх"}
          </span>
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-base outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-blue-100 sm:text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={kind === "program" ? "Хөтөлбөр хайх" : "Сургалт хайх"}
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Сэдвээр шүүх</span>
          <select
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-blue-100 sm:text-sm"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="all">8 үндсэн ангилал - Бүгд</option>
            {EDUCATION_CATEGORIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}. {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-base text-slate-900 sm:text-lg">
          {kind === "program" ? "Хөтөлбөрүүд" : "Сургалтууд"}
        </h2>
        <Link
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 text-xs hover:border-blue-200 hover:text-[#1F6FB2]"
          href={archiveHref}
        >
          <Archive className="size-3.5" /> Архив
        </Link>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 border-dashed px-4 py-8 text-center text-slate-500 text-sm">
          {query.trim() || category !== "all"
            ? "Таны хайлт, ангилалд тохирох контент олдсонгүй."
            : emptyText}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <Link
              className={`group hover:-translate-y-0.5 relative flex items-center gap-2.5 overflow-hidden rounded-2xl border p-3 transition sm:gap-3 sm:p-4 ${item.price > 0 ? "border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-[0_8px_24px_rgba(217,119,6,0.10)] hover:border-amber-400" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30"}`}
              href={itemHref(item)}
              key={item.id}
            >
              {item.price > 0 && (
                <span className="-top-8 -right-7 pointer-events-none absolute size-24 rounded-full bg-amber-200/30 blur-2xl" />
              )}
              <span
                className={`relative grid size-10 shrink-0 place-items-center rounded-xl text-lg sm:size-12 sm:text-xl ${item.price > 0 ? "bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200" : "bg-blue-50"}`}
              >
                {item.definition.icon || <BookOpen className="size-5" />}
                {item.price > 0 && (
                  <span className="-right-1 -bottom-1 absolute grid size-5 place-items-center rounded-full border-2 border-white bg-amber-500 text-white shadow-sm">
                    <Lock className="size-2.5" />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block font-semibold text-slate-900 text-sm">
                    {item.definition.title}
                  </span>
                  {item.price > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-[10px] text-amber-800">
                      <Sparkles className="size-3" /> Төлбөртэй
                    </span>
                  )}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-slate-500 text-xs leading-relaxed">
                  {item.definition.summary}
                </span>
                {item.definition.estimatedMinutes && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="size-3" />
                    {item.definition.estimatedMinutes} минут
                  </span>
                )}
                {item.price > 0 && (
                  <span className="mt-1.5 inline-flex items-center gap-1 font-extrabold text-[11px] text-amber-800">
                    <Lock className="size-3" />{" "}
                    {new Intl.NumberFormat("mn-MN").format(item.price)} ₮ · Нэг
                    удаа төлнө
                  </span>
                )}
              </span>
              <span
                className={`relative grid size-9 shrink-0 place-items-center rounded-full transition-transform group-hover:translate-x-0.5 ${item.price > 0 ? "bg-amber-500 text-white shadow-sm" : "text-slate-400"}`}
              >
                {item.price > 0 ? (
                  <Lock className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
