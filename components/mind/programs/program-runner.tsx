"use client";

import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/toast";
import {
  AppCard,
  Badge,
  PageHero,
  SectionHeading,
  TextArea,
} from "@/components/mind/app-shell";
import {
  missingRequiredResponseKeys,
  type ProgramAnswer,
  type ProgramDefinition,
  type ProgramQuestion,
  type ProgramRecommendation,
  type ProgramResponses,
  responseKey,
  scoreProgram,
  taskResponseKey,
} from "@/lib/programs/definition";

type ServerRun = {
  id: string;
  currentSectionId: string;
  responses: ProgramResponses;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
};

const RECOMMENDATION_LABELS: Record<ProgramRecommendation["type"], string> = {
  APP: "Апп",
  TEST: "Тест",
  TRAINING: "Сургалт",
  PROGRAM: "Хөтөлбөр",
};

function RecommendationCards({
  recommendations,
}: {
  recommendations: ProgramRecommendation[];
}) {
  if (recommendations.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <SectionHeading>Танд санал болгох дараагийн алхам</SectionHeading>
      <div className="mt-3 grid gap-3">
        {recommendations.map((recommendation) => (
          <div
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-blue-50/40 p-3"
            key={recommendation.id}
          >
            <div className="min-w-0">
              <span className="font-semibold text-[11px] text-blue-700 uppercase tracking-wide">
                {RECOMMENDATION_LABELS[recommendation.type]}
              </span>
              <div className="mt-1 font-semibold text-slate-900 text-sm">
                {recommendation.title}
              </div>
              <div className="mt-1 text-slate-600 text-xs leading-relaxed">
                {recommendation.note}
              </div>
            </div>
            <Link
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 text-xs hover:bg-slate-50"
              href={recommendation.href}
            >
              Нээх
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

type RunPayload = {
  run: ServerRun;
  definition: ProgramDefinition;
  version: number;
};

const TYPE_LABELS: Record<
  ProgramDefinition["sections"][number]["type"],
  string
> = {
  CONTENT: "Танилцуулга",
  ASSESSMENT: "Үнэлгээ",
  REFLECTION: "Эргэцүүлэл",
  GUIDED_CONVERSATION: "Ярилцлага",
  JOURNAL: "Тэмдэглэл",
  DAILY_TASKS: "Даалгавар",
  PROGRESS: "Ахиц",
  RESULT: "Дүгнэлт",
  HELP: "Тусламж",
};

function QuestionField({
  answer,
  onChange,
  question,
}: {
  answer: ProgramAnswer | undefined;
  onChange: (value: ProgramAnswer) => void;
  question: ProgramQuestion;
}) {
  const id = `program-question-${question.id}`;

  if (question.type === "TEXT") {
    return (
      <TextArea
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Бодлоо чөлөөтэй бичээрэй…"
        required={question.required}
        rows={4}
        value={typeof answer === "string" ? answer : ""}
      />
    );
  }

  if (question.type === "NUMBER") {
    return (
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
        id={id}
        max={question.max}
        min={question.min}
        onChange={(event) => onChange(Number(event.target.value))}
        required={question.required}
        step={question.step ?? 1}
        type="number"
        value={typeof answer === "number" ? answer : ""}
      />
    );
  }

  if (question.type === "SCALE") {
    const min = question.min ?? 0;
    const max = question.max ?? 10;
    const value = typeof answer === "number" ? answer : min;
    return (
      <div>
        <div className="mb-2 flex items-center justify-between text-slate-500 text-xs">
          <span>{question.minLabel ?? min}</span>
          <b className="text-lg text-slate-900">{value}</b>
          <span>{question.maxLabel ?? max}</span>
        </div>
        <input
          className="w-full accent-blue-600"
          id={id}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={question.step ?? 1}
          type="range"
          value={value}
        />
      </div>
    );
  }

  if (question.type === "SINGLE_CHOICE") {
    return (
      <div className="grid gap-2">
        {question.options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
            key={option.id}
          >
            <input
              checked={answer === option.id}
              name={id}
              onChange={() => onChange(option.id)}
              type="radio"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  const selected = Array.isArray(answer) ? answer : [];
  return (
    <div className="grid gap-2">
      {question.options.map((option) => (
        <label
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
          key={option.id}
        >
          <input
            checked={selected.includes(option.id)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, option.id]
                  : selected.filter((item) => item !== option.id)
              )
            }
            type="checkbox"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function SectionContent({
  definition,
  responses,
  sectionIndex,
  setResponse,
}: {
  definition: ProgramDefinition;
  responses: ProgramResponses;
  sectionIndex: number;
  setResponse: (key: string, value: ProgramAnswer) => void;
}) {
  const section = definition.sections[sectionIndex];
  const score = useMemo(
    () => scoreProgram(definition, responses),
    [definition, responses]
  );

  if (section.type === "RESULT") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
          <div className="font-extrabold text-4xl text-blue-700">
            {score.maximum > 0 ? `${score.percent}%` : "✓"}
          </div>
          <p className="mt-1 text-slate-600 text-sm">
            {score.maximum > 0
              ? `${score.earned}/${score.maximum} оноо`
              : "Таны хариултууд хадгалагдлаа"}
          </p>
        </div>
        {score.band && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <SectionHeading>{score.band.title}</SectionHeading>
            <p className="mt-2 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
              {score.band.body}
            </p>
          </div>
        )}
        {section.body && (
          <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
            {section.body}
          </p>
        )}
        <RecommendationCards recommendations={section.recommendations} />
      </div>
    );
  }

  if (section.type === "PROGRESS") {
    const expected = definition.sections.reduce(
      (total, item) =>
        total + item.questions.length + item.tasks.length * item.repeatDays,
      0
    );
    const answered = Object.values(responses).filter((value) =>
      Array.isArray(value)
        ? value.length > 0
        : value !== "" && value !== undefined
    ).length;
    const percent =
      expected > 0
        ? Math.min(100, Math.round((answered / expected) * 100))
        : 100;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <b>Нийт ахиц</b>
          <b className="text-blue-700">{percent}%</b>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-3 text-slate-500 text-sm">
          {answered} / {expected} хариулт, даалгавар бөглөсөн
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {section.body && (
        <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
          {section.body}
        </p>
      )}

      {section.questions.map((question, index) => {
        const key = responseKey(section.id, question.id);
        return (
          <div
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            key={key}
          >
            <label
              className="mb-3 block font-semibold text-sm"
              htmlFor={`program-question-${question.id}`}
            >
              {index + 1}. {question.prompt}
              {question.required && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>
            {question.description && (
              <p className="mb-3 text-slate-500 text-xs leading-relaxed">
                {question.description}
              </p>
            )}
            <QuestionField
              answer={responses[key]}
              onChange={(value) => setResponse(key, value)}
              question={question}
            />
          </div>
        );
      })}

      {section.tasks.length > 0 && (
        <div className="space-y-4">
          {Array.from(
            { length: section.repeatDays },
            (_, index) => index + 1
          ).map((day) => (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              key={day}
            >
              {section.repeatDays > 1 && (
                <SectionHeading className="mb-3">{day}-р өдөр</SectionHeading>
              )}
              <div className="space-y-2">
                {section.tasks.map((task) => {
                  const key = taskResponseKey(section.id, task.id, day);
                  return (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
                      key={key}
                    >
                      <input
                        checked={responses[key] === true}
                        className="mt-1"
                        onChange={(event) =>
                          setResponse(key, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span>
                        <b className="block text-sm">{task.title}</b>
                        {task.description && (
                          <span className="mt-1 block text-slate-500 text-xs leading-relaxed">
                            {task.description}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProgramRunner({ slug }: { slug: string }) {
  const [data, setData] = useState<RunPayload | null>(null);
  const [responses, setResponses] = useState<ProgramResponses>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [loadingError, setLoadingError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(
          `/api/mind/programs/${encodeURIComponent(slug)}/run`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) throw new Error("load_failed");
        const payload = (await response.json()) as RunPayload;
        const index = Math.max(
          0,
          payload.definition.sections.findIndex(
            (section) => section.id === payload.run.currentSectionId
          )
        );
        setData(payload);
        setResponses(payload.run.responses ?? {});
        setSectionIndex(index);
        hydrated.current = true;
      } catch {
        setLoadingError(true);
      }
    };
    load().catch(() => setLoadingError(true));
  }, [slug]);

  const currentSection = data?.definition.sections[sectionIndex];

  useEffect(() => {
    if (!data || !currentSection || !hydrated.current || completed) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch(
          `/api/mind/programs/${encodeURIComponent(slug)}/run`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "DRAFT",
              runId: data.run.id,
              currentSectionId: currentSection.id,
              responses,
            }),
          }
        );
        if (!response.ok) throw new Error("save_failed");
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
      } catch {
        toast({
          type: "error",
          description: "Явцыг хадгалж чадсангүй. Дахин оролдоно уу.",
        });
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [completed, currentSection, data, responses, slug]);

  if (loadingError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700 text-sm">
        Хөтөлбөрийг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.
      </div>
    );
  }
  if (!data || !currentSection) {
    return (
      <div className="grid min-h-48 place-items-center">
        <Loader2 className="size-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const definition = data.definition;
  const resultRecommendations =
    definition.sections.find((section) => section.type === "RESULT")
      ?.recommendations ?? [];
  const atLastSection = sectionIndex === definition.sections.length - 1;
  const missingHere = missingRequiredResponseKeys(definition, responses).filter(
    (key) => key.startsWith(`${currentSection.id}.`)
  );

  const move = (direction: -1 | 1) => {
    if (direction === 1 && missingHere.length > 0) {
      toast({
        type: "error",
        description:
          "Үргэлжлүүлэхийн өмнө шаардлагатай асуулт, даалгаврыг бөглөнө үү.",
      });
      return;
    }
    setSectionIndex((index) =>
      Math.max(0, Math.min(definition.sections.length - 1, index + direction))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = async () => {
    const missing = missingRequiredResponseKeys(definition, responses);
    if (missing.length > 0) {
      toast({
        type: "error",
        description: "Хөтөлбөрийн шаардлагатай бүх хэсгийг бөглөнө үү.",
      });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        `/api/mind/programs/${encodeURIComponent(slug)}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "COMPLETE",
            runId: data.run.id,
            currentSectionId: currentSection.id,
            responses,
          }),
        }
      );
      if (!response.ok) throw new Error("complete_failed");
      setCompleted(true);
      toast({ type: "success", description: "Хөтөлбөр амжилттай дууслаа." });
    } catch {
      toast({ type: "error", description: "Хөтөлбөрийг дуусгаж чадсангүй." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppCard>
      <PageHero
        description={currentSection.subtitle ?? definition.summary}
        eyebrow={<Badge>{TYPE_LABELS[currentSection.type]}</Badge>}
        icon={definition.icon}
        title={currentSection.title}
      />

      <nav aria-label="Хөтөлбөрийн явц" className="mb-6">
        <div className="mb-2 flex items-center justify-between text-slate-500 text-xs">
          <span>
            {sectionIndex + 1} / {definition.sections.length}
          </span>
          <span>
            {saving
              ? "Хадгалж байна…"
              : saved
                ? "Хадгалагдсан"
                : `v${data.version}`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width]"
            style={{
              width: `${((sectionIndex + 1) / definition.sections.length) * 100}%`,
            }}
          />
        </div>
      </nav>

      {completed ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
            <Check className="mx-auto size-10 text-emerald-600" />
            <h2 className="mt-3 font-bold text-lg">Хөтөлбөр дууслаа</h2>
            <p className="mt-1 text-slate-600 text-sm">
              Таны үр дүн архивт хадгалагдлаа.
            </p>
            <Link
              className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-sm text-white"
              href="/mind/programs/archive"
            >
              Архив харах
            </Link>
          </div>
          <RecommendationCards recommendations={resultRecommendations} />
        </div>
      ) : (
        <>
          <SectionContent
            definition={definition}
            responses={responses}
            sectionIndex={sectionIndex}
            setResponse={(key, value) =>
              setResponses((current) => ({ ...current, [key]: value }))
            }
          />

          {definition.disclaimer && (
            <p className="mt-6 rounded-xl bg-slate-50 p-3 text-slate-500 text-xs leading-relaxed">
              {definition.disclaimer}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-sm disabled:opacity-40"
              disabled={sectionIndex === 0 || saving}
              onClick={() => move(-1)}
              type="button"
            >
              <ChevronLeft className="size-4" /> Буцах
            </button>
            {atLastSection ? (
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-sm text-white disabled:opacity-50"
                disabled={saving}
                onClick={finish}
                type="button"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Хөтөлбөр дуусгах
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-sm text-white disabled:opacity-50"
                disabled={saving}
                onClick={() => move(1)}
                type="button"
              >
                Үргэлжлүүлэх <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </>
      )}
    </AppCard>
  );
}
