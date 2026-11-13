"use client";

import { CatalogLibrary } from "@/components/mind/catalog-library";
import { useEffect, useMemo, useState } from "react";
import type { TaxonomyAssignment } from "@/lib/taxonomy";

type Item = {
  id: string;
  externalKey: string;
  sourceApp: "WEB" | "AICHAT";
  kind: string;
  title: string;
  summary: string | null;
  href: string;
  used: boolean;
  price?: number;
  imageUrl?: string | null;
  programId?: string | null;
};
type Group = { kind: string; label: string; items: Item[] };
type Payload = { taxonomy: TaxonomyAssignment | null; groups: Group[] };
const TRAILING_SLASH = /\/$/;

function itemHref(item: Item) {
  if (item.sourceApp === "AICHAT" || item.href.startsWith("https://"))
    return item.href;
  const base = (
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://oyunsanaa.com"
  ).replace(TRAILING_SLASH, "");
  return `${base}${item.href.startsWith("/") ? item.href : `/${item.href}`}`;
}

export function AutomaticContentRecommendations({
  excludeExternalKey,
  heading = "Танд санал болгох зүйлс",
  taxonomy,
  text,
}: {
  excludeExternalKey?: string;
  heading?: string;
  taxonomy?: TaxonomyAssignment | null;
  text?: string;
}) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const taxonomyJson = useMemo(
    () => (taxonomy ? JSON.stringify(taxonomy) : ""),
    [taxonomy]
  );

  useEffect(() => {
    if (!taxonomyJson && !text?.trim()) {
      setPayload(null);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (taxonomyJson) params.set("taxonomy", taxonomyJson);
    if (text?.trim()) params.set("text", text.trim().slice(0, 4000));
    if (excludeExternalKey) params.set("exclude", excludeExternalKey);
    fetch(`/api/content/recommendations?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setPayload(body?.groups ? body : null))
      .catch((error) => {
        if (error?.name !== "AbortError") setPayload(null);
      });
    return () => controller.abort();
  }, [excludeExternalKey, taxonomyJson, text]);

  if (!payload || payload.groups.length === 0 || !payload.taxonomy) return null;
  const items = payload.groups.flatMap(group => group.items.map(item => ({
    ...item, href: itemHref(item), kindLabel: group.label,
    price: item.programId ? item.price : undefined,
    storageId: item.programId ? `program:${item.programId}` : item.externalKey,
  })));
  return <section className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 sm:p-5" data-testid="content-recommendations">
    <h2 className="mb-4 text-base font-bold text-[#234c68]">{heading}</h2>
    <CatalogLibrary items={items} compact/>
  </section>;
}
