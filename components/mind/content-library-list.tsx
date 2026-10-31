"use client";

import { Archive, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ContentLibraryCard } from "./content-library-card";
import { EDUCATION_CATEGORIES, getEducationCategory } from "@/lib/content/education-categories";

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
    coverImageUrl?: string;
    imageUrl?: string;
    estimatedMinutes?: number;
    deliveryMode?: "SELF_PACED" | "DAILY";
    durationDays?: number;
    taxonomy?: { categoryCode?: string };
  };
};

const LEGACY_PROGRAM_ROUTES: Record<string, string> = {
  "life-balance-v1": "/mind/who-am-i/balance-test",
};

export function ContentLibraryList({
  activeIds = [],
  archiveHref = "/mind/programs/archive",
  emptyText,
  items,
  kind,
}: {
  activeIds?: string[];
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
        (category === "active" && activeIds.includes(item.id)) ||
        getEducationCategory(item.definition.taxonomy?.categoryCode || "")?.code === category;
      const searchable = `${item.definition.title} ${item.definition.summary}`
        .normalize("NFC")
        .toLocaleLowerCase("mn-MN");
      return (
        matchesCategory &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [activeIds, category, items, query]);

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
            <option value="all">
              {EDUCATION_CATEGORIES.length} үндсэн ангилал - Бүгд
            </option>
            {kind === "program" && (
              <option value="active">Хэрэгжүүлж буй хөтөлбөрүүд</option>
            )}
            {EDUCATION_CATEGORIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.number}. {item.name}
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
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => <ContentLibraryCard key={item.id} item={{
            id: item.id, storageId: `program:${item.id}`,
            href: itemHref(item), title: item.definition.title, summary: item.definition.summary,
            kind: kind === "program" ? "PROGRAM" : "TRAINING", kindLabel: kind === "program" ? "Хөтөлбөр" : "Дижитал сургалт",
            price: item.price, imageUrl: item.definition.coverImageUrl || item.definition.imageUrl,
            duration: item.definition.deliveryMode === "DAILY" && item.definition.durationDays ? `${item.definition.durationDays} өдөр` : item.definition.estimatedMinutes ? `${item.definition.estimatedMinutes} минут` : undefined,
            statusLabel: activeIds.includes(item.id) ? "Хэрэгжүүлж буй" : undefined,
          }}/>)}
        </div>
      )}
    </div>
  );
}
