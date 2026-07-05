// components/health/HealthSummary.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bed,
  Flame,
  Footprints,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/mn";
import type { DailyItems, HealthTargets } from "./healthTypes";

// ── Types ───────────────────────────────────────────────────────────────────

type RangeKey = "week" | "month" | "all";

type HistoryLog = {
  date: string; // yyyy-mm-dd
  items: DailyItems | null;
};

type DayPoint = {
  date: string;
  steps: number | null;
  sleepHours: number | null;
  calories: number | null;
};

type ChartPoint = {
  label: string;
  steps: number | null;
  sleep: number | null;
  calories: number | null;
};

type S = Dictionary["apps"]["healthSummary"];

const RANGE_DAYS: Record<RangeKey, { days: number; bucketDays: number }> = {
  week: { days: 7, bucketDays: 1 },
  month: { days: 30, bucketDays: 7 },
  all: { days: 90, bucketDays: 15 },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatShortDate(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${m}.${d}`;
}

function logsToDayPoints(logs: HistoryLog[]): DayPoint[] {
  return logs.map((log) => {
    const items = log.items ?? {};
    const meals = items.meals ?? [];
    const calories = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
    return {
      date: log.date,
      steps: items.steps ?? null,
      sleepHours: items.sleepHours ?? null,
      calories: calories > 0 ? calories : null,
    };
  });
}

// Groups consecutive day points into buckets of `bucketDays` and averages
// each metric within a bucket. bucketDays=1 keeps one point per day.
function bucketize(
  points: DayPoint[],
  bucketDays: number,
  labelForBucket: (bucket: DayPoint[]) => string
): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let i = 0; i < points.length; i += bucketDays) {
    const bucket = points.slice(i, i + bucketDays);
    if (bucket.length === 0) continue;
    const steps = avg(
      bucket.map((p) => p.steps).filter((v): v is number => v != null)
    );
    const sleep = avg(
      bucket.map((p) => p.sleepHours).filter((v): v is number => v != null)
    );
    const calories = avg(
      bucket.map((p) => p.calories).filter((v): v is number => v != null)
    );
    out.push({
      label: labelForBucket(bucket),
      steps: steps != null ? Math.round(steps) : null,
      sleep: sleep != null ? round1(sleep) : null,
      calories: calories != null ? Math.round(calories) : null,
    });
  }
  return out;
}

function buildChartData(
  range: RangeKey,
  points: DayPoint[],
  weekdays: string[]
): ChartPoint[] {
  const cfg = RANGE_DAYS[range];
  if (cfg.bucketDays <= 1) {
    return bucketize(points, 1, (b) => {
      const d = new Date(b[0].date);
      return weekdays[d.getDay()];
    });
  }
  return bucketize(points, cfg.bucketDays, (b) => formatShortDate(b[0].date));
}

// Realistic sample series shown only when the user has no logged history yet,
// so the chart/insight card never renders empty on first visit.
function mockDayPoints(days: number): DayPoint[] {
  const out: DayPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const wave = Math.sin(i / 2.3);
    out.push({
      date: ymd,
      steps: Math.round(7800 + wave * 2600 + (i % 3) * 300),
      sleepHours: round1(7 + wave * 1.1 + (i % 2 === 0 ? 0.3 : -0.2)),
      calories: Math.round(1950 + wave * 220),
    });
  }
  return out;
}

type Insight = {
  badges: { label: string; value: string; icon: typeof Footprints }[];
  headline: string;
  lines: string[];
  tone: "good" | "mixed" | "watch";
};

function tpl(str: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    str
  );
}

function buildInsight(
  range: RangeKey,
  points: DayPoint[],
  targets: HealthTargets | null,
  s: S
): Insight {
  const stepsVals = points
    .map((p) => p.steps)
    .filter((v): v is number => v != null);
  const sleepVals = points
    .map((p) => p.sleepHours)
    .filter((v): v is number => v != null);
  const calVals = points
    .map((p) => p.calories)
    .filter((v): v is number => v != null);

  const avgSteps = avg(stepsVals);
  const avgSleep = avg(sleepVals);
  const avgCalories = avg(calVals);

  const targetSteps = targets?.targetSteps ?? null;
  const goalHitDays =
    targetSteps != null
      ? stepsVals.filter((s) => s >= targetSteps).length
      : null;

  const badges = [
    avgSteps != null
      ? {
          label: s.badges.avgSteps,
          value: `${Math.round(avgSteps).toLocaleString()}`,
          icon: Footprints,
        }
      : null,
    avgSleep != null
      ? {
          label: s.badges.avgSleep,
          value: `${avgSleep.toFixed(1)}${s.hourUnit}`,
          icon: Bed,
        }
      : null,
    avgCalories != null
      ? {
          label: s.badges.avgCalories,
          value: `${Math.round(avgCalories).toLocaleString()} ${s.kcalUnit}`,
          icon: Flame,
        }
      : null,
  ].filter(
    (b): b is { label: string; value: string; icon: typeof Footprints } =>
      b != null
  );

  const rangeLabel = s.rangeLabels[range];

  const lines: string[] = [];
  let good = 0;
  let watch = 0;

  if (avgSteps != null && targetSteps) {
    const pct = Math.round((avgSteps / targetSteps) * 100);
    const avgStr = Math.round(avgSteps).toLocaleString();
    if (pct >= 90) {
      good++;
      lines.push(tpl(s.lines.stepsGood, { avg: avgStr, pct }));
    } else if (pct >= 60) {
      lines.push(tpl(s.lines.stepsMid, { avg: avgStr, pct }));
    } else {
      watch++;
      lines.push(tpl(s.lines.stepsLow, { avg: avgStr, pct }));
    }
  }

  if (goalHitDays != null && points.length > 0) {
    lines.push(
      tpl(s.lines.goalHitDays, {
        rangeLabel,
        total: points.length,
        hit: goalHitDays,
      })
    );
  }

  if (avgSleep != null) {
    const avgStr = avgSleep.toFixed(1);
    if (avgSleep >= 7 && avgSleep <= 9) {
      good++;
      lines.push(tpl(s.lines.sleepGood, { avg: avgStr }));
    } else if (avgSleep < 7) {
      watch++;
      lines.push(tpl(s.lines.sleepLow, { avg: avgStr }));
    } else {
      lines.push(tpl(s.lines.sleepHigh, { avg: avgStr }));
    }
  }

  if (avgCalories != null && targets?.targetCalories) {
    const diffPct = Math.round(
      ((avgCalories - targets.targetCalories) / targets.targetCalories) * 100
    );
    if (Math.abs(diffPct) <= 10) {
      good++;
      lines.push(
        tpl(s.lines.caloriesGood, { target: targets.targetCalories })
      );
    } else if (diffPct > 10) {
      watch++;
      lines.push(tpl(s.lines.caloriesOver, { pct: diffPct }));
    } else {
      lines.push(tpl(s.lines.caloriesUnder, { pct: Math.abs(diffPct) }));
    }
  }

  const tone: Insight["tone"] =
    watch > good ? "watch" : good > 0 ? "good" : "mixed";

  const headline = s.headlines[tone];

  if (lines.length === 0) {
    lines.push(s.noDataLine);
  }

  return { badges, headline, lines, tone };
}

// ── Sub components ─────────────────────────────────────────────────────────

function RangeTabs({
  value,
  onChange,
  ranges,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  ranges: S["ranges"];
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border bg-muted/30 p-1 text-xs">
      {(Object.keys(ranges) as RangeKey[]).map((id) => (
        <button
          className={`flex-1 rounded-lg py-2 text-center font-medium transition-all ${
            value === id
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted/60"
          }`}
          key={id}
          onClick={() => onChange(id)}
          type="button"
        >
          {ranges[id]}
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label, tooltip }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div className="flex items-center gap-2" key={p.dataKey}>
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">
            {p.dataKey === "steps"
              ? tooltip.steps
              : p.dataKey === "sleep"
                ? tooltip.sleep
                : tooltip.calories}
            :
          </span>
          <span className="font-medium">
            {p.value == null ? "-" : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function HealthChart({
  data,
  legend,
  tooltip,
}: {
  data: ChartPoint[];
  legend: S["chartLegend"];
  tooltip: S["tooltip"];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="stepsFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid
            className="stroke-muted"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            className="fill-muted-foreground"
            dataKey="label"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            className="fill-muted-foreground"
            fontSize={11}
            tickLine={false}
            width={40}
            yAxisId="steps"
          />
          <YAxis
            axisLine={false}
            className="fill-muted-foreground"
            fontSize={11}
            hide
            orientation="right"
            tickLine={false}
            yAxisId="sleep"
          />
          <Tooltip
            content={<ChartTooltip tooltip={tooltip} />}
            cursor={{ fill: "rgba(16,185,129,0.06)" }}
          />
          <Bar
            animationDuration={700}
            barSize={22}
            dataKey="steps"
            fill="url(#stepsFill)"
            radius={[6, 6, 0, 0]}
            yAxisId="steps"
          />
          <Line
            animationDuration={900}
            dataKey="sleep"
            dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
            stroke="#3b82f6"
            strokeWidth={2.5}
            type="monotone"
            yAxisId="sleep"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> {legend.steps}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> {legend.sleep}
        </span>
      </div>
    </div>
  );
}

function InsightBadge({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Footprints;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 dark:border-emerald-400/20 dark:bg-emerald-400/10">
      <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="min-w-0">
        <div className="truncate text-[11px] text-muted-foreground">
          {label}
        </div>
        <div className="truncate font-semibold text-sm">{value}</div>
      </div>
    </div>
  );
}

const TONE_STYLES: Record<
  Insight["tone"],
  { border: string; bg: string; icon: typeof TrendingUp }
> = {
  good: {
    border: "border-emerald-500/20 dark:border-emerald-400/25",
    bg: "bg-emerald-500/5 dark:bg-emerald-400/10",
    icon: TrendingUp,
  },
  mixed: {
    border: "border-sky-500/20 dark:border-sky-400/25",
    bg: "bg-sky-500/5 dark:bg-sky-400/10",
    icon: Sparkles,
  },
  watch: {
    border: "border-amber-500/25 dark:border-amber-400/25",
    bg: "bg-amber-500/5 dark:bg-amber-400/10",
    icon: TrendingDown,
  },
};

// ── Main component ──────────────────────────────────────────────────────────

export default function HealthSummary({
  targets,
}: {
  targets: HealthTargets | null;
}) {
  const t = useT();
  const s = t.apps.healthSummary;
  const [range, setRange] = useState<RangeKey>("week");
  const [logs, setLogs] = useState<HistoryLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cfg = RANGE_DAYS[range];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/health/daily/history?days=${cfg.days}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.error) throw new Error(data.error);
        setLogs(data.logs ?? []);
      })
      .catch((e) => !cancelled && setError(e?.message ?? s.errorGeneric))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cfg.days, s.errorGeneric]);

  const isMock = !loading && !error && (!logs || logs.length === 0);

  const dayPoints = useMemo(() => {
    if (isMock) return mockDayPoints(cfg.days);
    return logsToDayPoints(logs ?? []);
  }, [logs, isMock, cfg.days]);

  const chartData = useMemo(
    () => buildChartData(range, dayPoints, s.weekdays),
    [range, dayPoints, s.weekdays]
  );

  const insight = useMemo(
    () => buildInsight(range, dayPoints, targets, s),
    [range, dayPoints, targets, s]
  );

  const toneStyle = TONE_STYLES[insight.tone];
  const ToneIcon = toneStyle.icon;

  return (
    <div className="space-y-4">
      <RangeTabs onChange={setRange} ranges={s.ranges} value={range} />

      <div className="rounded-2xl border bg-gradient-to-b from-card to-muted/20 p-4">
        {loading ? (
          <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            {s.loading}
          </div>
        ) : error ? (
          <div className="flex h-56 items-center justify-center text-destructive text-sm">
            {error}
          </div>
        ) : (
          <HealthChart data={chartData} legend={s.chartLegend} tooltip={s.tooltip} />
        )}
      </div>

      {isMock && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {s.mockNotice}
        </div>
      )}

      {insight.badges.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {insight.badges.map((b) => (
            <InsightBadge
              icon={b.icon}
              key={b.label}
              label={b.label}
              value={b.value}
            />
          ))}
        </div>
      )}

      <div
        className={`space-y-2 rounded-2xl border p-4 ${toneStyle.border} ${toneStyle.bg}`}
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <ToneIcon className="h-4 w-4" />
          {insight.headline}
        </div>
        <ul className="space-y-1.5 text-sm">
          {insight.lines.map((line) => (
            <li className="text-foreground/90 leading-relaxed" key={line}>
              • {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
