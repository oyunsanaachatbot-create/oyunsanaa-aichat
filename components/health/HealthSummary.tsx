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

const RANGES: {
  id: RangeKey;
  label: string;
  days: number;
  bucketDays: number;
}[] = [
  { id: "week", label: "7 хоног", days: 7, bucketDays: 1 },
  { id: "month", label: "1 сар", days: 30, bucketDays: 7 },
  { id: "all", label: "Нийт", days: 90, bucketDays: 15 },
];

const WEEKDAY_MN = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

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

function buildChartData(range: RangeKey, points: DayPoint[]): ChartPoint[] {
  const cfg = RANGES.find((r) => r.id === range) ?? RANGES[0];
  if (cfg.bucketDays <= 1) {
    return bucketize(points, 1, (b) => {
      const d = new Date(b[0].date);
      return WEEKDAY_MN[d.getDay()];
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

function buildInsight(
  range: RangeKey,
  points: DayPoint[],
  targets: HealthTargets | null
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
          label: "Дундаж алхам",
          value: `${Math.round(avgSteps).toLocaleString()}`,
          icon: Footprints,
        }
      : null,
    avgSleep != null
      ? { label: "Дундаж нойр", value: `${avgSleep.toFixed(1)}ц`, icon: Bed }
      : null,
    avgCalories != null
      ? {
          label: "Дундаж илчлэг",
          value: `${Math.round(avgCalories).toLocaleString()} ккал`,
          icon: Flame,
        }
      : null,
  ].filter(
    (b): b is { label: string; value: string; icon: typeof Footprints } =>
      b != null
  );

  const rangeLabel =
    range === "week"
      ? "долоо хоногт"
      : range === "month"
        ? "сард"
        : "хугацаанд";

  const lines: string[] = [];
  let good = 0;
  let watch = 0;

  if (avgSteps != null && targetSteps) {
    const pct = Math.round((avgSteps / targetSteps) * 100);
    if (pct >= 90) {
      good++;
      lines.push(
        `Алхалтын дундаж ${Math.round(avgSteps).toLocaleString()} алхам, зорилтын ${pct}% — маш сайн явц байна.`
      );
    } else if (pct >= 60) {
      lines.push(
        `Алхалтын дундаж ${Math.round(avgSteps).toLocaleString()} алхам, зорилтын ${pct}% байна. Өдөрт 15–20 минутын нэмэлт алхалт зорилгод хүрэхэд хангалттай.`
      );
    } else {
      watch++;
      lines.push(
        `Алхалтын дундаж ${Math.round(avgSteps).toLocaleString()} алхам нь зорилтоос эрс доогуур (${pct}%) байна. Хөдөлгөөнөө аажмаар нэмэхийг зөвлөж байна.`
      );
    }
  }

  if (goalHitDays != null && points.length > 0) {
    lines.push(
      `Та энэ ${rangeLabel} ${points.length}-с ${goalHitDays} өдөр алхалтын зорилгодоо хүрсэн байна.`
    );
  }

  if (avgSleep != null) {
    if (avgSleep >= 7 && avgSleep <= 9) {
      good++;
      lines.push(
        `Нойрны дундаж ${avgSleep.toFixed(1)} цаг — эрүүл хэмжээнд (7–9ц) байна.`
      );
    } else if (avgSleep < 7) {
      watch++;
      lines.push(
        `Нойрны дундаж ${avgSleep.toFixed(1)} цаг нь дутуу байна. Гүн нойрны хувь бага байх магадлалтай тул орондоо эрт орохыг зөвлөе.`
      );
    } else {
      lines.push(
        `Нойрны дундаж ${avgSleep.toFixed(1)} цаг нь бага зэрэг их байна. Унтах цагийн хэвшлээ тогтмолжуулаарай.`
      );
    }
  }

  if (avgCalories != null && targets?.targetCalories) {
    const diffPct = Math.round(
      ((avgCalories - targets.targetCalories) / targets.targetCalories) * 100
    );
    if (Math.abs(diffPct) <= 10) {
      good++;
      lines.push(
        `Илчлэгийн хэрэглээ зорилтот ${targets.targetCalories} ккал-тай ойролцоо, тэнцвэртэй байна.`
      );
    } else if (diffPct > 10) {
      watch++;
      lines.push(
        `Илчлэгийн дундаж хэрэглээ зорилтоос ${diffPct}%-иар илүү байна.`
      );
    } else {
      lines.push(
        `Илчлэгийн дундаж хэрэглээ зорилтоос ${Math.abs(diffPct)}%-иар бага байна.`
      );
    }
  }

  const tone: Insight["tone"] =
    watch > good ? "watch" : good > 0 ? "good" : "mixed";

  const headline =
    tone === "good"
      ? "Сайн байна! Ерөнхий чиг хандлага эерэг байна."
      : tone === "watch"
        ? "Анхаарах зүйлс байна — дараах зөвлөмжийг харна уу."
        : "Дараах зөвлөмжүүдийг харж, дэглэмээ тохируулаарай.";

  if (lines.length === 0) {
    lines.push(
      "Одоогоор энэ хугацаанд хангалттай өгөгдөл алга байна. Өдөр бүр бүртгэл хийвэл энд дэлгэрэнгүй дүгнэлт харагдана."
    );
  }

  return { badges, headline, lines, tone };
}

// ── Sub components ─────────────────────────────────────────────────────────

function RangeTabs({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border bg-muted/30 p-1 text-xs">
      {RANGES.map(({ id, label }) => (
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
          {label}
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
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
              ? "Алхам"
              : p.dataKey === "sleep"
                ? "Нойр (ц)"
                : "Илчлэг"}
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

function HealthChart({ data }: { data: ChartPoint[] }) {
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
            content={<ChartTooltip />}
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
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Алхам
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Нойр (цаг)
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
  const [range, setRange] = useState<RangeKey>("week");
  const [logs, setLogs] = useState<HistoryLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cfg = RANGES.find((r) => r.id === range) ?? RANGES[0];

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
      .catch((e) => !cancelled && setError(e?.message ?? "Алдаа гарлаа"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cfg.days]);

  const isMock = !loading && !error && (!logs || logs.length === 0);

  const dayPoints = useMemo(() => {
    if (isMock) return mockDayPoints(cfg.days);
    return logsToDayPoints(logs ?? []);
  }, [logs, isMock, cfg.days]);

  const chartData = useMemo(
    () => buildChartData(range, dayPoints),
    [range, dayPoints]
  );

  const insight = useMemo(
    () => buildInsight(range, dayPoints, targets),
    [range, dayPoints, targets]
  );

  const toneStyle = TONE_STYLES[insight.tone];
  const ToneIcon = toneStyle.icon;

  return (
    <div className="space-y-4">
      <RangeTabs onChange={setRange} value={range} />

      <div className="rounded-2xl border bg-gradient-to-b from-card to-muted/20 p-4">
        {loading ? (
          <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            Уншиж байна...
          </div>
        ) : error ? (
          <div className="flex h-56 items-center justify-center text-destructive text-sm">
            {error}
          </div>
        ) : (
          <HealthChart data={chartData} />
        )}
      </div>

      {isMock && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Бүртгэгдсэн мэдээлэл алга тул жишээ өгөгдөл харуулж байна. Өдөр бүр
          &quot;Хадгалах&quot; дарж бүртгэл хийвэл өөрийн дата харагдана.
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
