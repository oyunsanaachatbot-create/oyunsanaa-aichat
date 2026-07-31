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
} from "@/lib/mind/who-am-i-balance";
import {
  CAPACITIES,
  CAPACITY_REFLECTIONS,
  DAILY_REFLECTIONS,
  HIGH_REFLECTIONS,
  LOW_REFLECTIONS,
  type ProgramResult,
} from "@/lib/mind/who-am-i-program";
import { BalanceDiagram, type BalanceVizMode } from "./balance-diagram";

const { BRAND, INK, MUTED, LINE } = APP_SHELL_TOKENS;
const EVEN: BalancePercents = { body: 25, work: 25, bond: 25, meaning: 25 };

type Screen =
  | "intro"
  | "balance-intro"
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

type ProgramPayload = {
  screen: Screen;
  areaIdx: number;
  notes: Record<BalanceAreaKey, string>;
  pct: BalancePercents;
  answers: Record<string, string>;
  scores: Record<string, number>;
  finalNote: string;
};

type ServerRun = {
  id: string;
  screen: Screen;
  areaIdx: number;
  pct: BalancePercents;
  notes: Record<BalanceAreaKey, string>;
  answers: Record<string, string>;
  scores: Record<string, number>;
  finalNote: string;
  completedAt: string | null;
  updatedAt: string;
};

const initialNotes = (): Record<BalanceAreaKey, string> => ({
  body: "",
  work: "",
  bond: "",
  meaning: "",
});

const initialScores = () =>
  Object.fromEntries(CAPACITIES.map((capacity) => [capacity.id, 5]));

const PROGRAM_GOAL = [
  "Үйлчлүүлэгч энэхүү хөтөлбөрийн үр дүнд өөрийн амьдралын тэнцвэрийн өнөөгийн байдлыг тодорхойлж ойлгоно. Ямар талбараас зугтааж, ямар талбарт хорогдоод байгаагаа олж харна.",
  "Бусад талбартаа төдийлөн анхаарал хандуулалгүй, тухайн нэг талбарыг хэт анхаардаг байдлын цаана хүн амьдралынхаа явцад ямар ямар ур чадваруудыг хэт давуу хөгжүүлсэн бэ? Энэхүү хэт хөгжсөн ур чадвар нь амьдралд хэрхэн сайн болон муу байдлаар нөлөөлж байж болох вэ гэдгийг ажиглана.",
  "Мөн амьдралдаа ямар ямар ур чадваруудыг хөгжүүлээгүй, дутуу орхигдуулсан бэ? Үүний цаана ямар нөөц боломжууд байж болох вэ гэдгийг ажиглан судална.",
];

const BALANCE_INTRO =
  "Эерэг ба соёл хоорондын сэтгэл заслын аргаар хүний сэтгэл зүйн аливаа асуудлыг түүний хүч чадал, нөөц боломжтой хамт авч үздэг. Мөн ялгаатай соёл, ялгаатай үзэл баримтлалын зөрчилдөөнийг асуудлын эх үүсвэр гэхээс илүү хөгжлийн эх сурвалж гэж үздэг хүмүүнлэгийн чиг баримжаатай байдаг. Эерэг ба соёл хоорондын сэтгэл засалд амьдралыг дөрвөн үндсэн талбар болгон авч үздэг ба хүн стресс, зөрчилдөөн, амьдралын бэрхшээлээ шийдвэрлэхдээ өөрийн эрч хүч, энерги, боломжоо эдгээр талбаруудад харилцан адилгүй байдлаар хуваарилан зарцуулдаг гэж үздэг.";

function isScreen(value: unknown): value is Screen {
  return [
    "intro",
    "balance-intro",
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

function toPayload({
  answers,
  areaIdx,
  finalNote,
  notes,
  pct,
  scores,
  screen,
}: ProgramPayload): ProgramPayload {
  return { answers, areaIdx, finalNote, notes, pct, scores, screen };
}

function toProgramResult(run: ServerRun): ProgramResult {
  return {
    id: run.id,
    at: new Date(run.completedAt ?? run.updatedAt).getTime(),
    pct: run.pct,
    notes: run.notes,
    answers: run.answers,
    scores: run.scores,
    finalNote: run.finalNote,
  };
}

function PhaseProgress({ screen }: { screen: Screen }) {
  const phase =
    screen === "intro" || screen === "balance-intro" || screen === "history"
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
              required
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
  const [vizMode, setVizMode] = useState<BalanceVizMode>("kite");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [finalNote, setFinalNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [results, setResults] = useState<ProgramResult[]>([]);
  const [runId, setRunId] = useState<string | null>(null);

  const area = BALANCE_AREAS[Math.min(areaIdx, BALANCE_AREAS.length - 1)];
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
    runId !== null && results.some((result) => result.id === runId);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/mind/who-am-i/runs");
        if (!response.ok) throw new Error("result_load_failed");
        const data = (await response.json()) as {
          draft: ServerRun | null;
          results: ServerRun[];
        };
        setResults(data.results.map(toProgramResult));

        if (data.draft) {
          const draft = data.draft;
          if (isScreen(draft.screen) && draft.screen !== "intro") {
            setResumeScreen(draft.screen);
          }
          setRunId(draft.id);
          setAreaIdx(Math.max(0, Math.min(3, draft.areaIdx)));
          setNotes({ ...initialNotes(), ...draft.notes });
          setPct({ ...EVEN, ...draft.pct });
          setAnswers(draft.answers);
          setScores({ ...initialScores(), ...draft.scores });
          setFinalNote(draft.finalNote);
        }

        setSaveError(false);
      } catch {
        setSaveError(true);
      } finally {
        setLoaded(true);
      }
    };
    load().catch(() => setSaveError(true));
  }, []);

  useEffect(() => {
    if (
      !loaded ||
      currentSaved ||
      screen === "intro" ||
      screen === "history" ||
      screen === "summary"
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      const payload = toPayload({
        screen,
        areaIdx,
        notes,
        pct,
        answers,
        scores,
        finalNote,
      });
      const saveDraft = async () => {
        try {
          const response = await fetch("/api/mind/who-am-i/runs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: runId ?? undefined,
              mode: "draft",
              payload,
            }),
          });
          if (!response.ok) throw new Error("draft_save_failed");
          const data = (await response.json()) as { run: ServerRun };
          setRunId(data.run.id);
          setSaved(true);
          setSaveError(false);
          window.setTimeout(() => setSaved(false), 1200);
        } catch {
          setSaveError(true);
        }
      };
      saveDraft().catch(() => setSaveError(true));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    answers,
    areaIdx,
    currentSaved,
    finalNote,
    loaded,
    notes,
    pct,
    runId,
    scores,
    screen,
  ]);

  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setAnswer = (key: string, value: string) =>
    setAnswers((current) => ({ ...current, [key]: value }));
  const startFresh = () => {
    setResumeScreen(null);
    setAreaIdx(0);
    setNotes(initialNotes());
    setPct({ ...EVEN });
    setVizMode("kite");
    setAnswers({});
    setScores(initialScores());
    setFinalNote("");
    setRunId(null);
    setSaveError(false);
    go("balance-intro");
  };
  const finish = async () => {
    const payload = toPayload({
      screen: "summary",
      areaIdx,
      notes,
      pct,
      answers,
      scores,
      finalNote,
    });
    try {
      const response = await fetch("/api/mind/who-am-i/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: runId ?? undefined,
          mode: "complete",
          payload,
        }),
      });
      if (!response.ok) throw new Error("result_save_failed");
      const data = (await response.json()) as { run: ServerRun };
      const result = toProgramResult(data.run);
      setRunId(result.id);
      setResults((current) => [
        result,
        ...current.filter((item) => item.id !== result.id),
      ]);
      setSaved(true);
      setSaveError(false);
      go("summary");
    } catch {
      setSaveError(true);
    }
  };
  const openResult = (result: ProgramResult) => {
    setPct({ ...EVEN, ...result.pct });
    setNotes({ ...initialNotes(), ...result.notes });
    setAnswers(result.answers);
    setScores({ ...initialScores(), ...result.scores });
    setFinalNote(result.finalNote);
    setRunId(result.id);
    go("summary");
  };
  const requiredAnswersComplete = (prefix: string, questions: string[]) =>
    questions.every((_, index) => answers[`${prefix}-${index}`]?.trim());
  const continueFromObservation = () => {
    const complete =
      requiredAnswersComplete("daily", DAILY_REFLECTIONS) &&
      requiredAnswersComplete("high", HIGH_REFLECTIONS) &&
      requiredAnswersComplete("low", LOW_REFLECTIONS);
    if (!complete) {
      document.querySelector<HTMLTextAreaElement>("textarea:invalid")?.focus();
      return;
    }
    go("capacity-intro");
  };
  const finishProgram = () => {
    const capacityAnswersComplete = lowFive.every((capacity) =>
      requiredAnswersComplete(`capacity-${capacity.id}`, CAPACITY_REFLECTIONS)
    );
    if (!capacityAnswersComplete || !finalNote.trim()) {
      document.querySelector<HTMLTextAreaElement>("textarea:invalid")?.focus();
      return;
    }
    finish().catch(() => setSaveError(true));
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
        {saveError && <span>Серверт хадгалах үед алдаа гарлаа</span>}
      </div>
      <PhaseProgress screen={screen} />

      {screen === "intro" && (
        <section>
          <PageHero
            description="Өөрийн амьдралын тэнцвэр, хэт хөгжсөн ур чадвар болон нөөц боломжоо ажиглан ойлгох хөтөлбөр."
            eyebrow={<Badge>Хөтөлбөрийн зорилго</Badge>}
            icon="🧭"
            title="Амьдралын тэнцвэрээ ойлгох"
          />

          <div className="mb-6 space-y-4">
            {PROGRAM_GOAL.map((paragraph) => (
              <Muted key={paragraph}>{paragraph}</Muted>
            ))}
          </div>

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

          <div className="flex flex-wrap gap-2">
            {!resumeScreen && (
              <Button onClick={startFresh} type="button">
                Үргэлжлүүлэх →
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
            Хариулт таны бүртгэлтэй холбогдсон серверт хадгалагдана. Өөрийн
            бүртгэлээр нэвтэрсэн аль ч төхөөрөмжөөс үр дүнгээ харах боломжтой.
          </p>
        </section>
      )}

      {screen === "balance-intro" && (
        <section>
          <PageHero
            description="Хөтөлбөрийн эхний алхамд амьдралын дөрвөн талбарт өөрийн эрч хүч, цаг хугацаа, боломжоо хэрхэн хуваарилж байгаагаа ажиглана."
            eyebrow={<Badge>Хөтөлбөрийн алхам нэг</Badge>}
            icon="⚖️"
            title="Амьдралын тэнцвэр шалгах"
          />
          <Muted className="mb-5">{BALANCE_INTRO}</Muted>
          <Hint>
            <b>Даалгавар:</b> Амьдралын дөрвөн талбарын хүрээнд асуултуудад
            хариулах замаар бүх энерги, цаг хугацаа, нөөц боломжоо нийт 100% гэж
            үзээд талбар тус бүрд хэдэн хувийг зарцуулж байгаагаа хэмжинэ.
          </Hint>
          <Muted className="mb-5">
            <b>Санамж:</b> Ихэнхдээ дөрвөн талбарын хэт бага байгаа талбар нь
            үндсэн асуудал бус, эсрэгээрээ хэт илүү байгаа нь үндсэн асуудал
            болсон байдаг. Сул талбарт үүссэн асуудлыг илүү өндөр үнэлгээтэй
            талбартаа авчирч, дадсан ур чадвар, нөөц боломжоороо шийдэх гэж
            оролдсоор ирсэн байх нь түгээмэл.
          </Muted>
          <div className="flex justify-between gap-3">
            <Button onClick={() => go("intro")} type="button" variant="ghost">
              ← {t.common.back}
            </Button>
            <Button onClick={() => go("area")} type="button">
              Үргэлжлүүлэх →
            </Button>
          </div>
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
                {area.tag}
              </div>
              <div
                className="font-bold text-xl leading-tight"
                style={{ color: INK }}
              >
                {area.title}
              </div>
            </div>
          </div>
          <Muted className="mb-4">{area.desc}</Muted>
          <div
            className="overflow-hidden rounded-[14px] border"
            style={{ borderColor: LINE }}
          >
            {area.questions.map((question, index) => (
              <div
                className="flex gap-3 px-4 py-3.5"
                key={question}
                style={{
                  borderBottom:
                    index < area.questions.length - 1
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
                areaIdx === 0
                  ? go("balance-intro")
                  : setAreaIdx((index) => index - 1)
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
                      {item.title}
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
              {highestArea.title} ({pct[highestArea.key]}%)
            </b>{" "}
            талбарт зарцуулж байна. Энэ танд хүч өгдөг үү, эсвэл бусад асуудлаас
            зугтах байр болсон уу?
          </Insight>
          <Insight
            color={lowestArea.hex}
            title="Хамгийн бага · орхигдсон талбар"
          >
            <b>
              {lowestArea.title} ({pct[lowestArea.key]}%)
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
            Хамгийн өндөр: «{highestArea.title}»
          </SectionHeading>
          <ReflectionFields
            answers={answers}
            idPrefix="high"
            questions={HIGH_REFLECTIONS}
            setAnswer={setAnswer}
          />
          <SectionHeading className="mt-7 mb-3">
            Хамгийн бага: «{lowestArea.title}»
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
            <Button onClick={continueFromObservation} type="button">
              Алхам 3 →
            </Button>
          </div>
        </section>
      )}

      {screen === "capacity-intro" && (
        <section>
          <PageHero
            description="Эерэг ба соёл хоорондын сэтгэл засалд хүнийг хөгжих өндөр нөөц боломжтой гэж үзэх бөгөөд үүний үндэс нь 24 бодит ур чадвар (Actual Capabilities) юм. Эдгээр чадваруудыг төрөлхийн хайрлах чадвараас эхтэй анхдагч чадвар болон танин мэдэх чадвараас суралцдаг хоёрдогч чадвар гэж хоёр хуваадаг. Хүний амьдралын зөрчил, стресс нь эдгээр чадварын тэнцвэр алдагдах, эсвэл амьдралын хэв маяг, итгэл үнэмшил, үнэт зүйл, үзэл баримтлал, соёлын ялгаа хоорондоо мөргөлдөх үед үүсэж болно."
            eyebrow={<Badge>Алхам 3 · Хүлээн зөвшөөрөх</Badge>}
            icon="🧩"
            title="24 бодит чадвар"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Insight color="#C36C71" title="Анхдагч чадвар">
              Хайрлах чадвараас эхтэй чадварууд: хайр, хүлээн зөвшөөрөл, үлгэр
              жишээ авах, тэвчээр, цаг хугацаа, дотносол, харилцаа холбоо,
              итгэл, найдвар, халамж хайх, итгэлцэл, эргэлзээ, нэгдмэл байдал.
            </Insight>
            <Insight color="#C28A3C" title="Хоёрдогч чадвар">
              Танин мэдэх чадвараас эхтэй, нийгэмд амьдрах болон ажил хөдөлмөр
              эрхлэх явцад суралцдаг чадварууд: цаг баримтлах, цэвэрч байдал,
              цэгцтэй байдал, шударга зан, нарийвчлал, эелдэг байдал,
              дуулгавартай байдал, шударга ёс, хичээнгүй байдал, хэмнэлттэй
              байдал, найдвартай байдал, нууц хадгалах.
            </Insight>
          </div>
          <div
            className="my-4 rounded-r-[14px] border-l-[3px] px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "#FFFBEB",
              borderColor: "#EAB308",
              color: "#713F12",
            }}
          >
            Эдгээр чадварууд нь “сайн” эсвэл “муу” гэж хуваагддаггүй. Хамгийн
            гол нь тэнцвэр юм. Жишээ нь, хэт их “Цэвэрч байдал” нь эргэн
            тойрныхоо хүмүүсийг стресстүүлдэг бол, хэт бага “Шударга зан” нь
            харилцааг хуурамч болгодог. Аливаа ур чадвар хэт ихэдвэл хэт бага
            байхын адил асуудал дагуулдаг.
          </div>
          <div className="mt-6 flex justify-between">
            <Button onClick={() => go("observe")} type="button" variant="ghost">
              ← {t.common.back}
            </Button>
            <Button onClick={() => go("capacities")} type="button">
              Үргэлжлүүлэх →
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
          <Hint>
            Үнэлгээ өгөхдөө дараах асуултуудыг эргэцүүлээрэй: Хүмүүс намайг ийм
            гэж хэлдэг үү? Би өөрийнхөө төдийгүй, бусдын өмнөөс ч ийм байхыг
            хичээдэг үү? Би бусдын ийм чадварыг, эсвэл ийм биш байдлыг хараад
            хүчтэй хариу үйлдэл үзүүлдэг үү? Энэ чадвар миний өдөр тутмын
            шийдвэрт хэр их нөлөөлдөг вэ?
          </Hint>
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
            description="Миний төдийлөн ашигладаггүй чадварууд аль вэ? Миний хөгжүүлээгүй ертөнц хаана байна вэ?"
            eyebrow={<Badge>Алхам 4 · Ирээдүйд төвлөрөх</Badge>}
            icon="🌱"
            title="Ирээдүй, нөөц"
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
              Бодлоо чөлөөтэй бичээрэй: Дээрх жишээг эргэцүүлээд өөрийн хамгийн
              их ашигладаг ба хамгийн бага ашигладаг чадваруудын хооронд ямар
              уялдаа холбоо байж болох тухай бичээрэй.
            </span>
            <TextArea
              id="final-reflection"
              onChange={(event) => setFinalNote(event.target.value)}
              placeholder="Эцсийн эргэцүүллээ бичээрэй…"
              required
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
            <Button onClick={finishProgram} type="button">
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
              Хамгийн өндөр: <b style={{ color: INK }}>{highestArea.title}</b> ·
              Хамгийн бага: <b style={{ color: INK }}>{lowestArea.title}</b>
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
          {(["kite"] as BalanceVizMode[]).map((mode) => (
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
