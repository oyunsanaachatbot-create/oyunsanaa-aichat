"use client";

import Link from "next/link";
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
  return (
    <section
      className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
      data-testid="content-recommendations"
    >
      <h2 className="font-bold text-slate-900 text-sm">{heading}</h2>
      <div className="mt-4 space-y-5">
        {payload.groups.map((group) => (
          <section key={group.kind}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-blue-800 text-xs uppercase tracking-wide">
                {group.label}
              </h3>
              {group.items.length >= 3 && (
                <Link
                  className="text-blue-700 text-xs hover:underline"
                  href={{
                    pathname: "/mind/suggestions",
                    query: {
                      kind: group.kind,
                      source: "result",
                      taxonomy: JSON.stringify(payload.taxonomy),
                    },
                  }}
                >
                  Бусдыг харах →
                </Link>
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {group.items.slice(0, 2).map((item) => {
                const href = itemHref(item);
                const card = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <b className="text-slate-900 text-sm">{item.title}</b>
                      {item.used && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 font-semibold text-[9px] text-slate-500">
                          Өмнө ашигласан
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <p className="mt-1 line-clamp-2 text-slate-600 text-xs leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                    <span className="mt-2 inline-block font-semibold text-blue-700 text-xs">
                      Нээх →
                    </span>
                  </>
                );
                return href.startsWith("http") ? (
                  <a
                    className="rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-200"
                    href={href}
                    key={item.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {card}
                  </a>
                ) : (
                  <Link
                    className="rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-200"
                    href={href}
                    key={item.id}
                  >
                    {card}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
