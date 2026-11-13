"use client";

import { useEffect, useState } from "react";
import {
  APP_SHELL_TOKENS,
  AppCard,
  AppShell,
  Badge,
  Button,
  EmptyState,
  PageHero,
} from "@/components/mind/app-shell";
import {
  type HealthProgramData,
  loadHealthProgram,
} from "@/lib/mind/health-program";

const { INK, MUTED, LINE, BRAND, BRAND_RGB } = APP_SHELL_TOKENS;

export default function HealthSummaryPage() {
  const [data, setData] = useState<HealthProgramData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setData(loadHealthProgram());
    setMounted(true);
  }, []);

  if (!mounted) { return null; }

  if (!data) {
    return (
      <AppShell
        backHref="/mind/self-care/health/questionnaire"
        title="Дүгнэлт"
        width="3xl"
      >
        <AppCard>
          <EmptyState icon="📋">
            Та эрүүл мэндийн асуулгаа бөглөөгүй байна.
          </EmptyState>
          <div className="mt-4 flex justify-center">
            <Button href="/mind/self-care/health/questionnaire">
              Асуулга бөглөх
            </Button>
          </div>
        </AppCard>
      </AppShell>
    );
  }

  const { input, targets } = data;
  const isOver = targets.excessKg > 0;
  const isUnder = targets.excessKg < 0;

  const walkPct: Record<string, number> = { none: 15, low: 35, medium: 60, high: 90 };

  return (
    <AppShell
      backHref="/mind/self-care/health/questionnaire"
      title="Эрүүл мэндийн дүгнэлт"
      width="3xl"
    >
      <div className="space-y-4">
        {/* Hero */}
        <AppCard>
          <PageHero
            description="Асуулгын мэдээлэлд үндэслэн таны биеийн байдал ба зорилтыг тооцоолов."
            eyebrow={<Badge>Хувийн үнэлгээ</Badge>}
            icon="📊"
            title="Таны эрүүл мэндийн хөтөлбөр"
          />
        </AppCard>

        {/* Weight status */}
        <AppCard className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="font-semibold text-sm" style={{ color: INK }}>
            Жин ба биеийн байдал
          </div>
          <p className="text-sm leading-relaxed" style={{ color: INK }}>
            Та одоогоор <strong>{input.weightKg} кг</strong> жинтэй бөгөөд таны
            өндрийг бодолцвол хэвийн жин{" "}
            <strong>
              {targets.normalMin}–{targets.normalMax} кг
            </strong>{" "}
            орчим байна. BMI:{" "}
            <strong
              style={{
                color:
                  targets.bmi < 18.5 || targets.bmi >= 25
                    ? "#DC2626"
                    : "#16A34A",
              }}
            >
              {targets.bmi}
            </strong>
          </p>

          {isOver && (
            <p className="text-sm leading-relaxed" style={{ color: INK }}>
              Таны жинд{" "}
              <strong style={{ color: "#DC2626" }}>{targets.excessKg} кг</strong>{" "}
              илүүдэл байна. Аюулгүй хурдтайгаар{" "}
              <strong style={{ color: "#16A34A" }}>
                {targets.daysToGoal} хоногт
              </strong>{" "}
              хэвийн жинд хүрэх боломжтой.
            </p>
          )}
          {isUnder && (
            <p className="text-sm leading-relaxed" style={{ color: INK }}>
              Таны жинд{" "}
              <strong style={{ color: "#DC2626" }}>
                {Math.abs(targets.excessKg)} кг
              </strong>{" "}
              дутагдал байна. Аажим хэмнэлтэйгээр{" "}
              <strong style={{ color: "#16A34A" }}>
                {targets.daysToGoal} хоногт
              </strong>{" "}
              хэвийн жинд хүрэх боломжтой.
            </p>
          )}
          {!isOver && !isUnder && (
            <p className="text-sm leading-relaxed" style={{ color: INK }}>
              Таны жин хэвийн мужид байна. Хөтөлбөрийн гол зорилго нь{" "}
              <strong>эрүүл хэв маягаа тогтвортой хадгалах</strong> юм.
            </p>
          )}
        </AppCard>

        {/* Targets & macros */}
        <div className="grid gap-4 md:grid-cols-2">
          <AppCard className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="font-semibold text-sm" style={{ color: INK }}>
              Өдрийн зорилтууд
            </div>
            {[
              { label: "Нийт калори", value: `${targets.dailyCalories} ккал` },
              { label: "Ус", value: `${targets.targetWaterL} л` },
              { label: "Алхалт", value: `${targets.targetSteps.toLocaleString()} алхам` },
              { label: "Нойр", value: `${targets.sleepRecommended} цаг` },
            ].map(({ label, value }) => (
              <div
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                key={label}
                style={{
                  background: `rgba(${BRAND_RGB},0.06)`,
                  border: `1px solid rgba(${BRAND_RGB},0.12)`,
                }}
              >
                <span className="text-sm" style={{ color: MUTED }}>{label}</span>
                <strong className="text-sm" style={{ color: BRAND }}>{value}</strong>
              </div>
            ))}
          </AppCard>

          <AppCard className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="font-semibold text-sm" style={{ color: INK }}>
              Макро хуваарилалт
            </div>
            {[
              { label: "Уураг", pct: targets.proteinPercent, color: "#16A34A" },
              { label: "Нүүрс ус", pct: targets.carbPercent, color: BRAND },
              { label: "Өөх тос", pct: targets.fatPercent, color: "#D97706" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span style={{ color: INK }}>{label}</span>
                  <span className="font-semibold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: LINE }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
              Ямар ч хоол идэж болно — шим тэжээлээ тэнцвэртэй байлгах нь хамгийн чухал.
            </p>
          </AppCard>
        </div>

        {/* Metric comparisons */}
        <AppCard className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="font-semibold text-sm" style={{ color: INK }}>
            Хэвийн ба таны одоогийн үзүүлэлт
          </div>

          <MetricRow
            currentLabel={`${input.weightKg} кг`}
            currentPct={Math.min(
              100,
              isOver ? 95 : isUnder ? 40 : 75
            )}
            label="Жин"
            normalLabel={`${targets.normalMin}–${targets.normalMax} кг`}
            normalPct={75}
          />
          <MetricRow
            currentLabel={
              input.exercisePerWeek >= 5
                ? "Өдөр бүр дасгал хийдэг"
                : input.exercisePerWeek >= 3
                ? "7 хоногт 3–4 удаа"
                : input.exercisePerWeek >= 1
                ? "7 хоногт 1–2 удаа"
                : "Бага хөдөлгөөнтэй"
            }
            currentPct={Math.min(
              100,
              Math.round((input.exercisePerWeek / 6) * 90)
            )}
            label="Дасгал"
            normalLabel="7 хоногт 3–5 удаа"
            normalPct={75}
          />
          <MetricRow
            currentLabel={
              input.walkLevel === "high"
                ? "Сайн алхдаг"
                : input.walkLevel === "medium"
                ? "Дунд зэрэг"
                : input.walkLevel === "low"
                ? "Бага зэрэг"
                : "Бараг алхдаггүй"
            }
            currentPct={walkPct[input.walkLevel] ?? 20}
            label={`Алхалт (зорилт: ${targets.targetSteps.toLocaleString()})`}
            normalLabel={`${targets.targetSteps.toLocaleString()} алхам/өдөр`}
            normalPct={75}
          />
          <MetricRow
            currentLabel={`${input.sleepHours} цаг`}
            currentPct={Math.min(
              100,
              Math.round((input.sleepHours / targets.sleepRecommended) * 80)
            )}
            label="Нойр"
            normalLabel={`${targets.sleepRecommended} цаг`}
            normalPct={80}
          />
          <MetricRow
            currentLabel={`${input.waterLiters} л`}
            currentPct={Math.min(
              100,
              Math.round((input.waterLiters / targets.targetWaterL) * 75)
            )}
            label="Ус"
            normalLabel={`${targets.targetWaterL} л`}
            normalPct={75}
          />
        </AppCard>

        <Button className="w-full" href="/mind/self-care/health/program">
          Хөтөлбөрөө эхлүүлэх →
        </Button>

        <div className="flex justify-center">
          <Button href="/mind/self-care/health/questionnaire" variant="ghost">
            ← Асуулга засах
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function MetricRow({
  label,
  normalLabel,
  currentLabel,
  normalPct,
  currentPct,
}: {
  label: string;
  normalLabel: string;
  currentLabel: string;
  normalPct: number;
  currentPct: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium" style={{ color: INK }}>
        {label}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div
          className="rounded-xl border border-slate-100 p-3"
          style={{ background: "rgba(248,250,252,0.8)" }}
        >
          <div
            className="mb-1 text-[11px] uppercase tracking-wide"
            style={{ color: MUTED }}
          >
            Хэвийн үзүүлэлт
          </div>
          <div
            className="mb-1.5 h-2 w-full overflow-hidden rounded-full"
            style={{ background: LINE }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${normalPct}%`, background: "#4ADE80" }}
            />
          </div>
          <div className="text-xs" style={{ color: INK }}>
            {normalLabel}
          </div>
        </div>
        <div
          className="rounded-xl border border-slate-100 p-3"
          style={{ background: "rgba(248,250,252,0.8)" }}
        >
          <div
            className="mb-1 text-[11px] uppercase tracking-wide"
            style={{ color: MUTED }}
          >
            Таны өнөөгийн байдал
          </div>
          <div
            className="mb-1.5 h-2 w-full overflow-hidden rounded-full"
            style={{ background: LINE }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${currentPct}%`, background: "#38BDF8" }}
            />
          </div>
          <div className="text-xs" style={{ color: INK }}>
            {currentLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
