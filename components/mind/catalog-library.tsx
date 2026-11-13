"use client";
import { useState } from "react";
import { Search, BookOpen, Heart } from "lucide-react";
import { ContentLibraryCard, useContentSaved, type ContentLibraryCardItem } from "./content-library-card";
import { filterLibraryEntries, type LibraryView } from "@/lib/content/library-view";

export function CatalogLibrary({ items, emptyText = "Энэ чиглэлд нийтлэгдсэн контент одоогоор алга байна.", compact = false }: { items: ContentLibraryCardItem[]; emptyText?: string; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [view, setView] = useState<LibraryView>("all");
  const [limit, setLimit] = useState(compact ? 4 : 12);
  const saved = useContentSaved();
  const filtered = filterLibraryEntries(items, { query, kind, view, saved });
  const kinds = [...new Map(items.map(item => [item.kind, item.kindLabel])).entries()];
  const tabs: [LibraryView, string][] = [["all", "Бүгд"], ["saved", "Хадгалсан"], ["unused", "Ашиглаагүй"], ["used", "Ашигласан"]];
  return <div className="space-y-5">
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1" aria-label="Контентын төлөв">
      {tabs.map(([key,label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => { setView(key); setLimit(12); }} className={`min-h-10 flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition ${view === key ? "bg-white text-[#244b68] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{label}</button>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
      <label className="relative block"><Search size={17} aria-hidden className="absolute left-3.5 top-3.5 text-slate-400"/><span className="sr-only">Контент хайх</span><input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base outline-none focus:border-blue-400 sm:text-sm" type="search" placeholder="Нэр, сэдвээр хайх" value={query} onChange={event => { setQuery(event.target.value); setLimit(12); }}/></label>
      <label><span className="sr-only">Контентын төрөл</span><select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700" value={kind} onChange={event => { setKind(event.target.value); setLimit(12); }}><option value="">Бүх төрөл</option>{kinds.map(([code,label]) => <option key={code} value={code}>{label}</option>)}</select></label>
    </div>
    <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span aria-live="polite">{filtered.length} агуулга</span>{view === "saved" && <span className="inline-flex items-center gap-1"><Heart size={12}/>Энэ төхөөрөмжид хадгалсан</span>}</div>
    {filtered.length ? <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">{filtered.slice(0,limit).map(item => <ContentLibraryCard key={item.id} item={item}/>)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center"><BookOpen className="mx-auto mb-3 text-slate-300" size={28}/><p className="text-sm text-slate-500">{items.length ? view === "saved" ? "Картын зүрхэн дээр дарж энд хадгалаарай." : "Таны сонголтод тохирох контент олдсонгүй." : emptyText}</p>{(query || kind || view !== "all") && <button type="button" className="mt-4 text-sm font-semibold text-blue-700" onClick={() => { setQuery(""); setKind(""); setView("all"); }}>Бүгдийг харах</button>}</div>}
    {filtered.length > limit && <button className="mx-auto block min-h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50" type="button" onClick={() => setLimit(limit + 12)}>Цааш үзэх · {filtered.length - limit}</button>}
  </div>;
}
