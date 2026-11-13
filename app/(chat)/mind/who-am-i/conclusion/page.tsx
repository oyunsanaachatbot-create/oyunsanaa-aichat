"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AppCard,
  AppShell,
  Badge,
  Button,
  EmptyState,
  Muted,
  PageHero,
} from "@/components/mind/app-shell";
import { BalanceDiagram } from "@/components/mind/who-am-i/balance-diagram";
import { useT } from "@/lib/i18n/provider";
import {
  BALANCE_AREAS,
  type BalanceRun,
  clearHistory,
  deleteRun,
  readHistory,
  readLastRun,
} from "@/lib/mind/who-am-i-balance";

const BRAND = "#1F6FB2";
const INK_C = "#0F172A";
const MUTED_C = "rgba(15,23,42,0.60)";

function hexOf(key: string) {
  return BALANCE_AREAS.find((a) => a.key === key)?.hex ?? BRAND;
}

export default function WhoAmIConclusionPage() {
  const t = useT();
  const b = t.apps.lifeBalance;
  const c = b.conclusion;
  const [run, setRun] = useState<BalanceRun | null>(null);
  const [history, setHistory] = useState<BalanceRun[]>([]);

  useEffect(() => {
    setRun(readLastRun());
    setHistory(readHistory());
  }, []);

  const titleOf = (key: string) =>
    (b.areas as Record<string, { title: string }>)[key]?.title ?? key;

  const nextSteps = [
    { ...c.nextSteps.chat, href: "/" },
    { ...c.nextSteps.world, href: "/mind/ebooks" },
    { ...c.nextSteps.health, href: "/mind/self-care/stress" },
    { ...c.nextSteps.finance, href: "/mind/life/finance-app" },
    { ...c.nextSteps.relations, href: "/mind/relations/tests" },
    { ...c.nextSteps.goals, href: "/mind/purpose/goal-planner" },
  ];

  if (!run) {
    return (
      <AppShell backHref="/mind/who-am-i/intro" title={c.emptyTitle} width="4xl">
        <AppCard>
          <EmptyState icon="📊">{c.emptyText}</EmptyState>
          <div className="mt-4 flex justify-center">
            <Button href="/mind/who-am-i/balance-test">{c.checkBtn}</Button>
          </div>
        </AppCard>
      </AppShell>
    );
  }

  const entries = Object.entries(run.pct) as [string, number][];
  const hi = entries.reduce((m, x) => (x[1] > m[1] ? x : m));
  const lo = entries.reduce((m, x) => (x[1] < m[1] ? x : m));

  const highestHtml = c.highestTextHtml
    .replace(
      "{pct}",
      `<b style="color:${hexOf(hi[0])}">${hi[1]}%</b>`
    )
    .replace("{label}", `<b>«${titleOf(hi[0])}»</b>`);
  const lowestHtml = c.lowestTextHtml
    .replace("{label}", `<b>«${titleOf(lo[0])}»</b>`)
    .replace(
      "{pct}",
      `<b style="color:${hexOf(lo[0])}">${lo[1]}%</b>`
    );

  const onDeleteOne = (at: number) => {
    deleteRun(at);
    setHistory(readHistory());
  };
  const onDeleteAll = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <AppShell
      backHref="/mind/who-am-i/balance-test"
      title={c.emptyTitle}
      width="4xl"
    >
      <div className="space-y-4">
        <AppCard>
          <PageHero
            description={c.description}
            eyebrow={<Badge>{c.eyebrow}</Badge>}
            icon="📊"
            title={c.title}
          />

          <div className="mx-auto mb-2 max-w-[280px]">
            <BalanceDiagram
              ariaLabel={b.diagramAriaLabel}
              labels={b.diagramLabels}
              mode="kite"
              pct={run.pct}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {entries.map(([key, value]) => (
              <span
                className="rounded-full px-3 py-1.5 font-semibold text-white text-xs"
                key={key}
                style={{ background: hexOf(key) }}
              >
                {titleOf(key).split(" · ")[0]} {value}%
              </span>
            ))}
          </div>
        </AppCard>

        <AppCard className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-sm" style={{ color: INK_C }}>
            {c.highestTitle}
          </div>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: INK_C }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: dictionary-controlled template with numeric/label substitutions only.
            dangerouslySetInnerHTML={{ __html: highestHtml }}
          />
        </AppCard>

        <AppCard className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-sm" style={{ color: INK_C }}>
            {c.lowestTitle}
          </div>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: INK_C }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: dictionary-controlled template with numeric/label substitutions only.
            dangerouslySetInnerHTML={{ __html: lowestHtml }}
          />
        </AppCard>

        <div
          className="rounded-2xl border border-slate-200 p-4"
          style={{ background: "rgba(31,111,178,0.06)" }}
        >
          <div className="font-semibold text-sm" style={{ color: INK_C }}>
            {c.stepsHeading}
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: INK_C }}>
            {c.stepsIntro}
          </p>
          <div className="mt-3 grid gap-2.5">
            {nextSteps.map((s) => (
              <div
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                key={s.href + s.title}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm" style={{ color: INK_C }}>
                    {s.title}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed" style={{ color: MUTED_C }}>
                    {s.note}
                  </div>
                </div>
                <Link
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
                  href={s.href}
                  style={{ color: INK_C }}
                >
                  {c.goLink}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" href="/mind/who-am-i/balance-test">
          {c.retakeBtn}
        </Button>

        <AppCard className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-sm" style={{ color: INK_C }}>
              {c.historyHeading}
            </div>
            {history.length > 0 && (
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
                onClick={onDeleteAll}
                style={{ color: INK_C }}
                type="button"
              >
                <Trash2 className="size-4" />
                {c.deleteAllBtn}
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <Muted>{c.noHistory}</Muted>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  key={h.at}
                >
                  <div className="min-w-0">
                    <div className="text-xs" style={{ color: MUTED_C }}>
                      {new Date(h.at).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: INK_C }}>
                      {Object.entries(h.pct)
                        .map(([k, v]) => `${titleOf(k).split(" · ")[0]}:${v}%`)
                        .join(" • ")}
                    </div>
                  </div>
                  <button
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
                    onClick={() => onDeleteOne(h.at)}
                    style={{ color: INK_C }}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </AppCard>

        <p className="text-xs leading-relaxed" style={{ color: MUTED_C }}>
          {c.footerNote}
        </p>
      </div>
    </AppShell>
  );
}
