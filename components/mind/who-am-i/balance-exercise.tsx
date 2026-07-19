"use client";

import { Check, LockKeyhole, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  APP_SHELL_TOKENS,
  Badge,
  Button,
  Muted,
  PageHero,
  SectionHeading,
  TextArea,
} from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";
import {
  BALANCE_AREAS,
  type BalanceAreaKey,
  type BalancePercents,
  saveRun,
} from "@/lib/mind/who-am-i-balance";
import {
  CAPACITIES,
  CAPACITY_REFLECTIONS,
  DAILY_REFLECTIONS,
  HIGH_REFLECTIONS,
  LOW_REFLECTIONS,
  type ProgramResult,
  readProgramResults,
  saveProgramResult,
} from "@/lib/mind/who-am-i-program";
import { BalanceDiagram, type BalanceVizMode } from "./balance-diagram";

const { BRAND, INK, MUTED, LINE } = APP_SHELL_TOKENS;
const EVEN: BalancePercents = { body: 25, work: 25, bond: 25, meaning: 25 };
const DRAFT_KEY = "whoAmI:program:draft:v1";

type Screen =
  | "intro"
  | "area"
  | "test"
  | "balance-result"
  | "observe"
  | "capacity-intro"
  | "capacities"
  | "capacity-result"
  | "future"
  | "summary"
  | "history";

type Draft = {
  screen: Screen;
  areaIdx: number;
  notes: Record<BalanceAreaKey, string>;
  pct: BalancePercents;
  vizMode: BalanceVizMode;
  answers: Record<string, string>;
  scores: Record<string, number>;
  finalNote: string;
  resultAt: number | null;
};

const initialNotes = (): Record<BalanceAreaKey, string> => ({
  body: "",
  work: "",
  bond: "",
  meaning: "",
});

const initialScores = () =>
  Object.fromEntries(CAPACITIES.map((capacity) => [capacity.id, 5]));

function isScreen(value: unknown): value is Screen {
  return [
    "intro",
    "area",
    "test",
    "balance-result",
    "observe",
    "capacity-intro",
    "capacities",
    "capacity-result",
    "future",
    "summary",
    "history",
  ].includes(String(value));
}

function PhaseProgress({ screen }: { screen: Screen }) {
  const phase =
    screen === "intro" || screen === "history"
      ? 0
      : ["area", "test", "balance-result"].includes(screen)
        ? 1
        : screen === "observe"
          ? 2
          : ["capacity-intro", "capacities", "capacity-result"].includes(screen)
            ? 3
            : 4;
  const labels = ["Тэнцвэр", "Ажиглах", "Хүлээн зөвшөөрөх", "Ирээдүй"];

  return (
    <nav aria-label="Хөтөлбөрийн явц" className="mb-6 grid grid-cols-4 gap-1.5">
      {labels.map((label, index) => {
        const step = index + 1;
        const active = phase === step;
        const complete = phase > step || screen === "summary";
        return (
          <div key={label}>
            <div
              className="h-1 overflow-hidden rounded-full"
              style={{ background: LINE }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  background: active || complete ? BRAND : LINE,
                  width: active || complete ? "100%" : "0%",
                }}
              />
            </div>
            <div
              className="mt-1 truncate text-center font-medium text-[10px] sm:text-[11px]"
              style={{ color: active ? INK : MUTED }}
            >
              {step} · {label}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-4 rounded-r-[14px] border-l-[3px] px-4 py-3 text-sm leading-relaxed"
      style={{
        background: "#F8FAFC",
        borderColor: "#CBD5E1",
        color: "#334155",
      }}
    >
      {children}
    </div>
  );
}

function ReflectionFields({
  idPrefix,
  questions,
  answers,
  setAnswer,
}: {
  idPrefix: string;
  questions: string[];
  answers: Record<string, string>;
  setAnswer: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const key = `${idPrefix}-${index}`;
        return (
          <label className="block" htmlFor={key} key={key}>
            <span
              className="mb-1.5 block font-medium text-sm"
              style={{ color: INK }}
            >
              {question}
            </span>
            <TextArea
              id={key}
              onChange={(event) => setAnswer(key, event.target.value)}
              placeholder="Бодлоо чөлөөтэй бичээрэй…"
              rows={2}
              value={answers[key] ?? ""}
            />
          </label>
        );
      })}
    </div>
  );
}

export function BalanceExercise() {
  const t = useT();
  const b = t.apps.lifeBalance;
  const [screen, setScreen] = useState<Screen>("intro");
  const [resumeScreen, setResumeScreen] = useState<Screen | null>(null);
  const [areaIdx, setAreaIdx] = useState(0);
  const [notes, setNotes] = useState(initialNotes);
  const [pct, setPct] = useState<BalancePercents>({ ...EVEN });
  const [vizMode, setVizMode] = useState<BalanceVizMode>("platform");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [finalNote, setFinalNote] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [results, setResults] = useState<ProgramResult[]>([]);
  const [resultAt, setResultAt] = useState<number | null>(null);

  const area = BALANCE_AREAS[Math.min(areaIdx, BALANCE_AREAS.length - 1)];
  const areaT = b.areas[area.key];
  const sum = pct.body + pct.work + pct.bond + pct.meaning;
  const isBalancedTotal = sum === 100;
  const orderedAreas = useMemo(
    () => [...BALANCE_AREAS].sort((a, z) => pct[z.key] - pct[a.key]),
    [pct]
  );
  const rankedCapacities = useMemo(
    () =>
      [...CAPACITIES].sort((a, z) => (scores[z.id] ?? 5) - (scores[a.id] ?? 5)),
    [scores]
  );
  const highestArea = orderedAreas[0];
  const lowestArea = orderedAreas.at(-1) ?? orderedAreas[0];
  const topFive = rankedCapacities.slice(0, 5);
  const lowFive = rankedCapacities.slice(-5).reverse();
  const currentSaved =
    resultAt !== null && results.some((result) => result.at === resultAt);

  useEffect(() => {
    setResults(readProgramResults());
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<Draft>;
        if (isScreen(draft.screen) && draft.screen !== "intro") {
          setResumeScreen(draft.screen);
        }
        setAreaIdx(Math.max(0, Math.min(3, draft.areaIdx ?? 0)));
        setNotes({ ...initialNotes(), ...(draft.notes ?? {}) });
        setPct({ ...EVEN, ...(draft.pct ?? {}) });
        if (["kite", "platform", "auras"].includes(String(draft.vizMode))) {
          setVizMode(draft.vizMode as BalanceVizMode);
        }
        setAnswers(draft.answers ?? {});
        setScores({ ...initialScores(), ...(draft.scores ?? {}) });
        setFinalNote(draft.finalNote ?? "");
        setResultAt(draft.resultAt ?? null);
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || screen === "intro" || screen === "history") return;
    const timer = window.setTimeout(() => {
      const draft: Draft = {
        screen,
        areaIdx,
        notes,
        pct,
        vizMode,
        answers,
        scores,
        finalNote,
        resultAt,
      };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
      } catch {
        // Browsers may block storage; the exercise still works in memory.
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    answers,
    areaIdx,
    finalNote,
    hydrated,
    notes,
    pct,
    resultAt,
    scores,
    screen,
    vizMode,
  ]);

  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setAnswer = (key: string, value: string) =>
    setAnswers((current) => ({ ...current, [key]: value }));
  const startFresh = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setResumeScreen(null);
    setAreaIdx(0);
    setNotes(initialNotes());
    setPct({ ...EVEN });
    setVizMode("platform");
    setAnswers({});
    setScores(initialScores());
    setFinalNote("");
    setResultAt(null);
    go("area");
  };
  const finish = () => {
    const at = resultAt ?? Date.now();
    saveRun({ at, pct, notes, change: finalNote });
    setResults(
      saveProgramResult({ at, pct, notes, answers, scores, finalNote })
    );
    setResultAt(at);
    go("summary");
  };
  const openResult = (result: ProgramResult) => {
    setPct({ ...EVEN, ...result.pct });
    setNotes({ ...initialNotes(), ...result.notes });
    setAnswers(result.answers);
    setScores({ ...initialScores(), ...result.scores });
    setFinalNote(result.finalNote);
    setResultAt(result.at);
    go("summary");
  };

  return (
    <div className="wai-balance w-full">
      <style>{`
        .wai-balance input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:28px;width:100%}
        .wai-balance input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:#E2E8F0}
        .wai-balance input[type=range]::-moz-range-track{height:5px;border-radius:99px;background:#E2E8F0}
        .wai-balance input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid currentColor;margin-top:-7.5px;box-shadow:0 1px 4px rgba(0,0,0,.12)}
        .wai-balance input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid currentColor;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      `}</style>

      <div
        className="wai-no-print flex h-5 justify-end text-xs"
        style={{ color: MUTED }}
      >
        {saved && (
          <span className="inline-flex items-center gap-1">
            <Check className="size-3.5" /> Хадгалагдлаа
          </span>
        )}
      </div>
      <PhaseProgress screen={screen} />

      {screen === "intro" && (
        <section>
          <PageHero
            description="Амьдралынхаа тэнцвэрийг зураглаж, өөрийн хүчтэй болон хөгжүүлээгүй нөөцийг шүүмжлэлгүйгээр ажиглах дөрвөн алхамт аян."
            eyebrow={<Badge>Эерэг ба соёл хоорондын сэтгэл засал</Badge>}
            icon="🧭"
            title={
              <>
                Өөрийгөө таньж <span style={{ color: "#6E6CA3" }}>ойлгох</span>{" "}
                нь
              </>
            }
          />

          {resumeScreen && (
            <div
              className="mb-5 rounded-[16px] border p-4"
              style={{
                background: "rgba(126,155,110,0.08)",
                borderColor: "#B8CBAA",
              }}
            >
              <p className="font-medium text-sm" style={{ color: INK }}>
                Өмнөх ажил тань энэ төхөөрөмж дээр хадгалагдсан байна.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => go(resumeScreen)} type="button">
                  Үргэлжлүүлэх →
                </Button>
                <Button onClick={startFresh} type="button" variant="ghost">
                  Шинээр эхлэх
                </Button>
              </div>
            </div>
          )}

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              ["#7E9B6E", "1 · Тэнцвэр", "4 талбарын үнэлгээ"],
              ["#C28A3C", "2 · Ажиглах", "Таних, ойлгох"],
              ["#C36C71", "3 · Хүлээн зөвшөөрөх", "24 бодит чадвар"],
              ["#6E6CA3", "4 · Ирээдүй", "Нөөцөө судлах"],
            ].map(([color, title, subtitle]) => (
              <div
                className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
                key={title}
                style={{ borderColor: LINE, background: "#FAFBFD" }}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <div>
                  <b
                    className="block font-semibold text-sm"
                    style={{ color: INK }}
                  >
                    {title}
                  </b>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {!resumeScreen && (
              <Button onClick={startFresh} type="button">
                Эхлэх →
              </Button>
            )}
            {results.length > 0 && (
              <Button
                onClick={() => go("history")}
                type="button"
                variant="ghost"
              >
                Хадгалсан үр дүн ({results.length})
              </Button>
            )}
          </div>
          <p
            className="mt-5 flex items-start gap-2 text-xs leading-relaxed"
            style={{ color: MUTED }}
          >
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />
            Хариулт зөвхөн энэ төхөөрөмжийн браузерт хадгалагдана. Сервер рүү
            илгээгдэхгүй.
          </p>
        </section>
      )}

      {screen === "history" && (
        <section>
          <PageHero
            description="Өмнө дуусгасан үнэлгээнүүд энэ төхөөрөмж дээр хадгалагдана. Аль нэгийг нээж дэлгэрэнгүй зураглалаа дахин хараарай."
            eyebrow={<Badge>Миний түүх</Badge>}
            icon="🗂️"
            title="Хадгалсан үр дүн"
          />
          {results.length === 0 ? (
            <div
              className="rounded-[16px] border border-dashed px-4 py-10 text-center text-sm"
              style={{ borderColor: LINE, color: MUTED }}
            >
              Хадгалсан үр дүн алга байна.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => {
                const strongest = [...BALANCE_AREAS].sort(
                  (a, z) => result.pct[z.key] - result.pct[a.key]
                )[0];
                return (
                  <div
                    className="flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center"
                    key={result.at}
                    style={{ borderColor: LINE, background: "#FAFBFD" }}
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm" style={{ color: INK }}>
                        {new Intl.DateTimeFormat("mn-MN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(result.at)}
                      </b>
                      <p className="mt-1 text-xs" style={{ color: MUTED }}>
                        Хамгийн өндөр: {b.fields[strongest.key].title} ·{" "}
                        {result.pct[strongest.key]}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => openResult(result)} type="button">
                        Үр дүн харах
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6">
            <Button onClick={() => go("intro")} type="button" variant="ghost">
              ← {t.common.back}
            </Button>
          </div>
        </section>
      )}

      {screen === "area" && (
        <section>
          <div className="mb-6 flex gap-1.5">
            {BALANCE_AREAS.map((item, index) => (
              <div
                className="h-1 flex-1 overflow-hidden rounded-full"
                key={item.key}
                style={{ background: LINE }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: index <= areaIdx ? "100%" : "0%",
                    background: item.hex,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="grid size-11 shrink-0 place-items-center rounded-[12px] font-bold text-sm text-white"
              style={{ background: area.hex }}
            >
              {areaIdx + 1}
            </div>
            <div>
              <div className="font-medium text-xs" style={{ color: MUTED }}>
                {areaT.tag}
              </div>
              <div
                className="font-bold text-xl leading-tight"
                style={{ color: INK }}
              >
                {areaT.title}
              </div>
            </div>
          </div>
          <Muted className="mb-4">{areaT.desc}</Muted>
          <div
            className="overflow-hidden rounded-[14px] border"
            style={{ borderColor: LINE }}
          >
            {areaT.questions.map((question, index) => (
              <div
                className="flex gap-3 px-4 py-3.5"
                key={question}
                style={{
                  borderBottom:
                    index < areaT.questions.length - 1
                      ? `1px solid ${LINE}`
                      : "none",
                  background: "#FAFBFD",
                }}
              >
                <span
                  className="w-5 shrink-0 font-medium text-sm"
                  style={{ color: MUTED }}
                >
                  {index + 1}
                </span>
                <p
                  className="m-0 text-sm leading-relaxed"
                  style={{ color: INK }}
                >
                  {question}
                </p>
              </div>
            ))}
          </div>
          <label className="mt-4 block" htmlFor={`area-note-${area.key}`}>
            <span
              className="mb-1.5 block font-medium text-xs"
              style={{ color: MUTED }}
            >
              {b.noteLabel}
            </span>
            <TextArea
              id={`area-note-${area.key}`}
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  [area.key]: event.target.value,
                }))
              }
              placeholder={b.notePlaceholder}
              rows={3}
              value={notes[area.key]}
            />
          </label>
          <div className="mt-6 flex items-center justify-between">
            <Button
              onClick={() =>
                areaIdx === 0 ? go("intro") : setAreaIdx((index) => index - 1)
              }
              type="button"
              variant="ghost"
            >
              ← {t.common.back}
            </Button>
            <Button
              onClick={() =>
                areaIdx === BALANCE_AREAS.length - 1
                  ? go("test")
                  : setAreaIdx((index) => index + 1)
              }
              type="button"
            >
              {areaIdx === BALANCE_AREAS.length - 1
                ? b.continueToTest
                : b.continueNext}
            </Button>
          </div>
        </section>
      )}

      {screen === "test" && (
        <section>
          <SectionHeading className="mb-1">{b.testHeading}</SectionHeading>
          <p className="mb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
            Одоогийн цаг, энерги, нөөцөө нийт <b>100%</b> гэж үзээд дөрвөн
            талбарт хуваарилна уу.
          </p>
          <BalanceCard
            b={b}
            pct={pct}
            setVizMode={setVizMode}
            vizMode={vizMode}
          />
          <div className="mb-5 grid gap-5">
            {BALANCE_AREAS.map((item) => (
              <label key={item.key} style={{ color: item.hex }}>
                <span className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: item.hex }}
                    />
                    <span
                      className="font-medium text-sm"
                      style={{ color: INK }}
                    >
                      {b.areas[item.key].title}
                    </span>
                  </span>
                  <b className="text-lg" style={{ color: INK }}>
                    {pct[item.key]}%
                  </b>
                </span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    setPct((current) => ({
                      ...current,
                      [item.key]: Number(event.target.value),
                    }))
                  }
                  type="range"
                  value={pct[item.key]}
                />
              </label>
            ))}
          </div>
          <div
            className="flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-sm"
            style={
              isBalancedTotal
                ? {
                    background: "rgba(126,155,110,0.08)",
                    borderColor: "#9DB58D",
                  }
                : { borderColor: LINE, background: "#FAFBFD" }
            }
          >
            <span style={{ color: INK }}>
              {b.sumLabel} <b>{sum}%</b>{" "}
              <span style={{ color: MUTED }}>
                {isBalancedTotal
                  ? b.sumReady
                  : sum < 100
                    ? b.sumMissing.replace("{n}", String(100 - sum))
                    : b.sumOver.replace("{n}", String(sum - 100))}
              </span>
            </span>
            <button
              className="shrink-0 text-xs"
              onClick={() => setPct({ ...EVEN })}
              style={{ color: MUTED }}
              type="button"
            >
              {b.evenSplitBtn}
            </button>
          </div>
          <div className="mt-6 flex justify-between">
            <Button onClick={() => go("area")} type="button" variant="ghost">
              ← {t.common.back}
            </Button>
            <Button
              disabled={!isBalancedTotal}
              onClick={() => go("balance-result")}
              type="button"
            >
              Үр дүн →
            </Button>
          </div>
        </section>
      )}

      {screen === "balance-result" && (
        <section>
          <PageHero
            description="Энэ зураг зөв, бурууг хэмжихгүй. Харин таны энерги одоо хаашаа урсаж байгааг ажиглуулна."
            eyebrow={<Badge>Алхам 1 · Тэнцвэрийн зураглал</Badge>}
            icon="📊"
            title="Таны тэнцвэр"
          />
          <BalanceCard
            b={b}
            pct={pct}
            setVizMode={setVizMode}
            vizMode={vizMode}
          />
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {orderedAreas.map((item) => (
              <span
                className="rounded-full px-3 py-1.5 font-semibold text-white text-xs"
                key={item.key}
                style={{ background: item.hex }}
              >
                {b.fields[item.key].title} {pct[item.key]}%
              </span>
            ))}
          </div>
          <Insight
            color={highestArea.hex}
            title="Хамгийн өндөр · «хоргодох байр» уу?"
          >
            Та энергийнхээ хамгийн ихийг{" "}
            <b>
              {b.areas[highestArea.key].title} ({pct[highestArea.key]}%)
            </b>{" "}
            талбарт зарцуулж байна. Энэ танд хүч өгдөг үү, эсвэл бусад асуудлаас
            зугтах байр болсон уу?
          </Insight>
          <Insight
            color={lowestArea.hex}
            title="Хамгийн бага · орхигдсон талбар"
          >
            <b>
              {b.areas[lowestArea.key].title} ({pct[lowestArea.key]}%)
            </b>{" "}
            хамгийн бага байна. Үүнийг буруутгалгүй ажиглаарай.
          </Insight>
          <Hint>
            <b>Санамж:</b> Бага талбар дангаараа асуудал биш. Бид сул талбарын
            зөрчлөө хамгийн өндөр талбартаа дассан аргаараа шийдэх гэж оролдох
            нь элбэг.
          </Hint>
          <div className="mt-6 flex justify-between">
            <Button onClick={() => go("test")} type="button" variant="ghost">
              ← Засах
            </Button>
            <Button onClick={() => go("observe")} type="button">
              Алхам 2 →
            </Button>
          </div>
        </section>
      )}

      {screen === "observe" && (
        <section>
          <PageHero
            description="Өнгөрснөө шүүх биш, одоо хийж буй сонголтоо судлаач мэт тайван анзаараарай."
            eyebrow={<Badge>Алхам 2 · Ажиглах, таних, ойлгох</Badge>}
            icon="👁️"
            title="Шүүмжлэлгүй ажиглаарай"
          />
          <SectionHeading className="mb-3">Өдөр тутмын ажиглалт</SectionHeading>
          <ReflectionFields
            answers={answers}
            idPrefix="daily"
            questions={DAILY_REFLECTIONS}
            setAnswer={setAnswer}
          />
          <SectionHeading className="mt-7 mb-3">
            Хамгийн өндөр: «{b.areas[highestArea.key].title}»
          </SectionHeading>
          <ReflectionFields
            answers={answers}
            idPrefix="high"
            questions={HIGH_REFLECTIONS}
            setAnswer={setAnswer}
          />
          <SectionHeading className="mt-7 mb-3">
            Хамгийн бага: «{b.areas[lowestArea.key].title}»
          </SectionHeading>
          <ReflectionFields
            answers={answers}
            idPrefix="low"
            questions={LOW_REFLECTIONS}
            setAnswer={setAnswer}
          />
          <div className="mt-7 flex justify-between">
            <Button
              onClick={() => go("balance-result")}
              type="button"
              variant="ghost"
            >
              ← {t.common.back}
            </Button>
            <Button onClick={() => go("capacity-intro")} type="button">
              Алхам 3 →
            </Button>
          </div>
        </section>
      )}

      {screen === "capacity-intro" && (
        <section>
          <PageHero
            description="Эерэг сэтгэл заслын үүднээс хүн бүрт хөгжүүлэх боломжтой бодит чадварууд бий. Стресс нь тэдгээрийг хэт их эсвэл хэт бага ашиглахад үүсэж болно."
            eyebrow={<Badge>Алхам 3 · Хүлээн зөвшөөрөх</Badge>}
            icon="🧩"
            title="24 бодит чадвар"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Insight color="#C36C71" title="Анхдагч чадвар">
              Хайрлах чадвараас эхтэй сэтгэл хөдлөлийн тал: итгэл, найдвар,
              тэвчээр, хайр зэрэг.
            </Insight>
            <Insight color="#C28A3C" title="Хоёрдогч чадвар">
              Танин мэдэхүйгээс суралцдаг нийгмийн зан үйл: цаг баримтлах, цэгц,
              шударга зан зэрэг.
            </Insight>
          </div>
          <Hint>
            Эдгээр нь “сайн” эсвэл “муу” биш. Гол нь уян хатан тэнцвэр — ямар
            үед аль чадвараа сонгон ашиглаж байгаагаа анзаарах.
          </Hint>
          <div className="mt-6 flex justify-between">
            <Button onClick={() => go("observe")} type="button" variant="ghost">
              ← {t.common.back}
            </Button>
            <Button onClick={() => go("capacities")} type="button">
              Үнэлж эхлэх →
            </Button>
          </div>
        </section>
      )}

      {screen === "capacities" && (
        <section>
          <PageHero
            description="Чадвар тус бүрийг амьдралдаа хэр ашигладгаараа 0–10 оноогоор үнэлээрэй."
            eyebrow={<Badge>Алхам 3 · Үнэлгээ</Badge>}
            icon="🎚️"
            title="Өөрийн чадварын зураглал"
          />
          <div
            className="mb-5 flex flex-wrap gap-1.5 text-[11px]"
            style={{ color: MUTED }}
          >
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: LINE }}
            >
              0–2 бараг үгүй
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: LINE }}
            >
              3–4 хаяа
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: LINE }}
            >
              5–6 дунд
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: LINE }}
            >
              7–8 байнга
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: LINE }}
            >
              9–10 намайг тодорхойлно
            </span>
          </div>
          {(["primary", "secondary"] as const).map((group) => (
            <div className="mb-7" key={group}>
              <SectionHeading className="mb-1 flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background: group === "primary" ? "#C36C71" : "#C28A3C",
                  }}
                />
                {group === "primary" ? "Анхдагч чадвар" : "Хоёрдогч чадвар"}
              </SectionHeading>
              <Muted className="mb-2">
                {group === "primary"
                  ? "Сэтгэл хөдлөл, холбоо, хайрлах чадвар"
                  : "Суралцсан зан үйл, нийгмийн чадвар"}
              </Muted>
              <div className="divide-y" style={{ borderColor: LINE }}>
                {CAPACITIES.filter((capacity) => capacity.group === group).map(
                  (capacity) => {
                    const value = scores[capacity.id] ?? 5;
                    const color =
                      value <= 3
                        ? "#B58B8E"
                        : value <= 6
                          ? "#B0A17F"
                          : "#7E9B6E";
                    return (
                      <label
                        className="block py-3"
                        key={capacity.id}
                        style={{ color }}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <b className="block text-sm" style={{ color: INK }}>
                              {capacity.name}
                            </b>
                            <span
                              className="text-xs leading-relaxed"
                              style={{ color: MUTED }}
                            >
                              {capacity.description}
                            </span>
                          </span>
                          <b className="shrink-0 text-xl">{value}</b>
                        </span>
                        <input
                          max={10}
                          min={0}
                          onChange={(event) =>
                            setScores((current) => ({
                              ...current,
                              [capacity.id]: Number(event.target.value),
                            }))
                          }
                          type="range"
                          value={value}
                        />
                      </label>
                    );
                  }
                )}
              </div>
            </div>
          ))}
          <div className="mt-6 flex justify-between">
            <Button
              onClick={() => go("capacity-intro")}
              type="button"
              variant="ghost"
            >
              ← {t.common.back}
            </Button>
            <Button onClick={() => go("capacity-result")} type="button">
              Топ чадвараа харах →
            </Button>
          </div>
        </section>
      )}

      {screen === "capacity-result" && (
        <section>
          <PageHero
            description="Эдгээр нь таны хүчирхэг нөөц. Гэхдээ та бараг бүх асуудлаа зөвхөн эдгээрээр шийдэх гэж оролддог эсэхээ ажиглаарай."
            eyebrow={<Badge>Алхам 3 · Хэт хөгжсөн чадвар</Badge>}
            icon="✨"
            title="Хамгийн их ашигладаг 5"
          />
          <div className="space-y-3">
            {topFive.map((capacity, index) => (
              <Insight
                color={capacity.group === "primary" ? "#C36C71" : "#C28A3C"}
                key={capacity.id}
                title={`${index + 1} · ${capacity.name} · ${scores[capacity.id]}/10`}
              >
                {capacity.description}
              </Insight>
            ))}
          </div>
          <Hint>
            Өнөөдрийг хүртэл давуу тал гэж бодож ирсэн зүйл хэт хатуу итгэл
            үнэмшил болж зөрчил үүсгэж байж болно. Үүнийг анзаарах нь өөрийгөө
            буруутгах бус, сонголтоо нэмэх алхам юм.
          </Hint>
          <div className="mt-6 flex justify-between">
            <Button
              onClick={() => go("capacities")}
              type="button"
              variant="ghost"
            >
              ← Засах
            </Button>
            <Button onClick={() => go("future")} type="button">
              Алхам 4 →
            </Button>
          </div>
        </section>
      )}

      {screen === "future" && (
        <section>
          <PageHero
            description="Хамгийн бага ашигладаг чадварууд бол таны дутагдал биш — нээгдээгүй нөөц, шинэ сонголтын орон зай юм."
            eyebrow={<Badge>Алхам 4 · Ирээдүйд төвлөрөх</Badge>}
            icon="🌱"
            title="Хөгжүүлээгүй ертөнц"
          />
          <SectionHeading className="mb-3">Топ 5 ↔ Сул 5</SectionHeading>
          <div className="mb-5 grid grid-cols-2 gap-2 text-sm">
            <div
              className="text-center font-semibold text-xs"
              style={{ color: MUTED }}
            >
              Хамгийн их
            </div>
            <div
              className="text-center font-semibold text-xs"
              style={{ color: MUTED }}
            >
              Хамгийн бага
            </div>
            {topFive.map((capacity, index) => (
              <div className="contents" key={capacity.id}>
                <div
                  className="flex justify-between gap-2 rounded-xl border p-2.5"
                  style={{ borderColor: "#D8B98A" }}
                >
                  <span>{capacity.name}</span>
                  <b>{scores[capacity.id]}</b>
                </div>
                <div
                  className="flex justify-between gap-2 rounded-xl border p-2.5"
                  style={{ borderColor: "#C9AEB0" }}
                >
                  <span>{lowFive[index].name}</span>
                  <b>{scores[lowFive[index].id]}</b>
                </div>
              </div>
            ))}
          </div>
          <Hint>
            Зорилго нь хүчтэй чадвараа багасгах биш. Харин сул чадвараа ашиглах
            боломжийг хажууд нь нэмж, сонголтоо өргөжүүлэх юм.
          </Hint>
          <SectionHeading className="mt-7 mb-3">
            Сул чадвараа судлах
          </SectionHeading>
          <div className="space-y-4">
            {lowFive.map((capacity) => (
              <div
                className="rounded-[16px] border p-4"
                key={capacity.id}
                style={{ borderColor: LINE, background: "#FAFBFD" }}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <b className="text-sm" style={{ color: INK }}>
                    {capacity.name}
                  </b>
                  <span className="font-bold" style={{ color: "#C36C71" }}>
                    {scores[capacity.id]}/10
                  </span>
                </div>
                <ReflectionFields
                  answers={answers}
                  idPrefix={`capacity-${capacity.id}`}
                  questions={CAPACITY_REFLECTIONS}
                  setAnswer={setAnswer}
                />
              </div>
            ))}
          </div>
          <label className="mt-5 block" htmlFor="final-reflection">
            <span className="mb-1.5 block font-medium text-sm">
              Би юунаас айж, зугтааж, юуг олж авах гэж эдгээр сонголтоо хийсээр
              ирсэн бэ?
            </span>
            <TextArea
              id="final-reflection"
              onChange={(event) => setFinalNote(event.target.value)}
              placeholder="Эцсийн эргэцүүллээ бичээрэй…"
              rows={4}
              value={finalNote}
            />
          </label>
          <div className="mt-7 flex justify-between">
            <Button
              onClick={() => go("capacity-result")}
              type="button"
              variant="ghost"
            >
              ← {t.common.back}
            </Button>
            <Button onClick={finish} type="button">
              Дүгнэлт →
            </Button>
          </div>
        </section>
      )}

      {screen === "summary" && (
        <section>
          <PageHero
            description="Энэ бол эцсийн шошго биш, харин цааш ажиглах эхлэл. Зураглалаа үе үе эргэн хараарай."
            eyebrow={<Badge>Дүгнэлт</Badge>}
            icon="🗺️"
            title="Таны зураглал"
          />
          <div
            className="rounded-[16px] border p-4"
            style={{ borderColor: LINE, background: "#FAFBFD" }}
          >
            <SectionHeading className="mb-2">Амьдралын тэнцвэр</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {orderedAreas.map((item) => (
                <span
                  className="rounded-full px-3 py-1.5 font-semibold text-white text-xs"
                  key={item.key}
                  style={{ background: item.hex }}
                >
                  {b.fields[item.key].title} {pct[item.key]}%
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm" style={{ color: MUTED }}>
              Хамгийн өндөр:{" "}
              <b style={{ color: INK }}>{b.areas[highestArea.key].title}</b> ·
              Хамгийн бага:{" "}
              <b style={{ color: INK }}>{b.areas[lowestArea.key].title}</b>
            </p>
            <SectionHeading className="mt-5 mb-2">
              Хамгийн их ашигладаг 5
            </SectionHeading>
            <p className="text-sm leading-relaxed">
              {topFive
                .map((capacity) => `${capacity.name} · ${scores[capacity.id]}`)
                .join("  •  ")}
            </p>
            <SectionHeading className="mt-5 mb-2">
              Хөгжүүлэх боломжтой 5
            </SectionHeading>
            <p className="text-sm leading-relaxed">
              {lowFive
                .map((capacity) => `${capacity.name} · ${scores[capacity.id]}`)
                .join("  •  ")}
            </p>
            {finalNote && (
              <>
                <SectionHeading className="mt-5 mb-2">
                  Миний гол эргэцүүлэл
                </SectionHeading>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {finalNote}
                </p>
              </>
            )}
          </div>
          <Hint>
            Шаардлагатай бол Оюунсанаа чаттай бодлоо хуваалцаж, эсвэл мэргэжлийн
            сэтгэл зүйчтэй ярилцаарай. Энэ дасгал нь оношилгоо биш.
          </Hint>
          {currentSaved ? (
            <div
              className="mt-4 flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm"
              style={{
                background: "rgba(126,155,110,0.08)",
                borderColor: "#9DB58D",
                color: INK,
              }}
            >
              <Check className="size-4 text-[#648052]" />
              Үр дүн энэ төхөөрөмж дээр хадгалагдлаа.
            </div>
          ) : (
            <div className="mt-4">
              <Button onClick={finish} type="button">
                Үр дүн хадгалах
              </Button>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <Button onClick={() => go("future")} type="button" variant="ghost">
              ← Засах
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => go("history")}
                type="button"
                variant="ghost"
              >
                Хадгалсан үр дүн
              </Button>
              <Button onClick={startFresh} type="button">
                <RotateCcw className="size-4" /> Шинээр эхлэх
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function BalanceCard({
  b,
  pct,
  setVizMode,
  vizMode,
}: {
  b: ReturnType<typeof useT>["apps"]["lifeBalance"];
  pct: BalancePercents;
  setVizMode: (mode: BalanceVizMode) => void;
  vizMode: BalanceVizMode;
}) {
  return (
    <div
      className="mb-5 rounded-[16px] border p-4"
      style={{ borderColor: LINE, background: "#FAFBFD" }}
    >
      <div className="mb-3 flex justify-center">
        <div
          className="inline-flex gap-0.5 rounded-full border p-1"
          style={{ background: "#EEF2F8", borderColor: LINE }}
        >
          {(["kite", "platform", "auras"] as BalanceVizMode[]).map((mode) => (
            <button
              className="rounded-full px-3 py-1.5 font-medium text-xs transition-all"
              key={mode}
              onClick={() => setVizMode(mode)}
              style={
                vizMode === mode
                  ? { background: BRAND, color: "#fff" }
                  : { color: MUTED }
              }
              type="button"
            >
              {b.vizModes[mode]}
            </button>
          ))}
        </div>
      </div>
      <BalanceDiagram
        ariaLabel={b.diagramAriaLabel}
        className="mx-auto h-auto w-full max-w-[300px]"
        labels={b.diagramLabels}
        mode={vizMode}
        pct={pct}
      />
      <div className="mt-1.5 text-center text-xs" style={{ color: MUTED }}>
        {b.vizCaptions[vizMode]}
      </div>
    </div>
  );
}

function Insight({
  children,
  color,
  title,
}: {
  children: React.ReactNode;
  color: string;
  title: string;
}) {
  return (
    <div
      className="my-3 rounded-[16px] border p-4"
      style={{ borderColor: LINE, background: "#FAFBFD" }}
    >
      <div
        className="mb-1.5 flex items-center gap-2 font-semibold text-xs uppercase tracking-wide"
        style={{ color: MUTED }}
      >
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        {title}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: INK }}>
        {children}
      </p>
    </div>
  );
}
