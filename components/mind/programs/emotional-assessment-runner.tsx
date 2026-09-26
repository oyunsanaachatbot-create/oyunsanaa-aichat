"use client";

import { Check, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAssessmentResults,
  getReachableAssessmentSections,
  responseKey,
  type ProgramAnswer,
  type ProgramDefinition,
  type ProgramQuestion,
  type ProgramResponses,
} from "@/lib/programs/definition";
import { toast } from "@/components/toast";
import {
  AppCard,
  Badge,
  PageHero,
  SectionHeading,
  TextArea,
} from "@/components/mind/app-shell";

type ServerRun = {
  id: string;
  currentSectionId: string;
  responses: ProgramResponses;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
};

type AssessmentPayload = {
  run: ServerRun;
  definition: ProgramDefinition;
  version: number;
};

function selectedIds(answer: ProgramAnswer | undefined) {
  return new Set(
    Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : []
  );
}

function isAnswered(
  question: ProgramQuestion,
  answer: ProgramAnswer | undefined
) {
  if (!question.required) return true;
  if (Array.isArray(answer)) return answer.length > 0;
  return answer !== undefined && answer !== "";
}

function QuestionInput({
  question,
  answer,
  onChange,
}: {
  question: ProgramQuestion;
  answer: ProgramAnswer | undefined;
  onChange: (answer: ProgramAnswer) => void;
}) {
  if (question.type === "TEXT" || question.type === "SCENARIO") {
    return (
      <TextArea
        className="mt-4"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Хариултаа бичнэ үү"
        rows={4}
        value={typeof answer === "string" ? answer : ""}
      />
    );
  }

  if (question.type === "NUMBER") {
    return (
      <input
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
        max={question.max}
        min={question.min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={question.step ?? 1}
        type="number"
        value={typeof answer === "number" ? answer : ""}
      />
    );
  }

  if (question.type === "SCALE") {
    const minimum = question.min ?? 0;
    const maximum = question.max ?? 10;
    const value = typeof answer === "number" ? answer : minimum;
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between text-slate-500 text-xs">
          <span>{question.minLabel ?? minimum}</span>
          <strong className="rounded-full bg-blue-50 px-3 py-1 text-base text-blue-700">
            {value}
          </strong>
          <span>{question.maxLabel ?? maximum}</span>
        </div>
        <input
          aria-label={question.prompt}
          className="w-full accent-blue-600"
          max={maximum}
          min={minimum}
          onChange={(event) => onChange(Number(event.target.value))}
          step={question.step ?? 1}
          type="range"
          value={value}
        />
      </div>
    );
  }

  const multiple = ["MULTIPLE_CHOICE", "MATCHING", "ORDERING"].includes(
    question.type
  );
  const selected = selectedIds(answer);
  return (
    <div className="mt-4 grid gap-2">
      {question.options.map((option) => {
        const checked = selected.has(option.id);
        return (
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${checked ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
            key={option.id}
          >
            <input
              checked={checked}
              className="mt-0.5"
              name={question.id}
              onChange={() => {
                if (multiple) {
                  onChange(
                    checked
                      ? [...selected].filter((id) => id !== option.id)
                      : [...selected, option.id]
                  );
                } else {
                  onChange(option.id);
                }
              }}
              type={multiple ? "checkbox" : "radio"}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function EmotionalAssessmentRunner({
  slug,
  initialData,
}: {
  slug: string;
  initialData: AssessmentPayload;
}) {
  const { definition, version } = initialData;
  const initialResponses = initialData.run.responses ?? {};
  const initialReachable = getReachableAssessmentSections(
    definition,
    initialResponses
  );
  const root =
    definition.sections.find(
      (candidate) =>
        candidate.type === "ASSESSMENT" &&
        candidate.assessment?.blockType === "FIELD"
    ) ??
    initialReachable[0] ??
    definition.sections.find((candidate) => candidate.type === "ASSESSMENT");
  const [responses, setResponses] =
    useState<ProgramResponses>(initialResponses);
  const [currentSectionId, setCurrentSectionId] = useState(
    initialData.run.currentSectionId || root?.id || ""
  );
  const [currentQuestionId, setCurrentQuestionId] = useState("");
  const [pendingSectionIds, setPendingSectionIds] = useState<string[]>([]);
  const [visitedSectionIds, setVisitedSectionIds] = useState<string[]>(
    initialReachable.length
      ? initialReachable.map((reachable) => reachable.id)
      : root
        ? [root.id]
        : []
  );
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(
    initialData.run.status === "COMPLETED"
  );
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  const assessmentSections = useMemo(
    () =>
      definition.sections.filter(
        (candidate) => candidate.type === "ASSESSMENT" && candidate.assessment
      ),
    [definition.sections]
  );
  const section =
    assessmentSections.find((item) => item.id === currentSectionId) ?? root;
  const question =
    section?.questions.find((item) => item.id === currentQuestionId) ??
    section?.questions[0];
  const questionIndex =
    section && question
      ? section.questions.findIndex((item) => item.id === question.id)
      : -1;
  const results = useMemo(
    () => getAssessmentResults(definition, responses),
    [definition, responses]
  );

  useEffect(() => {
    if (!section) return;
    setCurrentQuestionId((current) =>
      section.questions.some((item) => item.id === current)
        ? current
        : (section.assessment?.entryQuestionId ??
          section.questions[0]?.id ??
          "")
    );
  }, [section]);

  useEffect(() => {
    if (!hydrated.current || completed || !section) return;
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
              runId: initialData.run.id,
              currentSectionId: section.id,
              responses,
            }),
          }
        );
        if (!response.ok) throw new Error("save_failed");
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
  }, [completed, initialData.run.id, responses, section, slug]);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  const enterSection = (sectionId: string, remaining: string[]) => {
    const next = assessmentSections.find((item) => item.id === sectionId);
    if (!next) {
      setPendingSectionIds(remaining);
      return;
    }
    setCurrentSectionId(next.id);
    setCurrentQuestionId(
      next.assessment?.entryQuestionId ?? next.questions[0]?.id ?? ""
    );
    setPendingSectionIds(remaining);
    setVisitedSectionIds((current) =>
      current.includes(next.id) ? current : [...current, next.id]
    );
    setMessage("");
  };

  const complete = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/mind/programs/${encodeURIComponent(slug)}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "COMPLETE",
            runId: initialData.run.id,
            currentSectionId: section?.id ?? root?.id ?? "",
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

  const finishCurrentSection = (extraSectionIds: string[] = []) => {
    const queue = [...pendingSectionIds, ...extraSectionIds]
      .filter((id, index, all) => all.indexOf(id) === index)
      .filter((id) => !visitedSectionIds.includes(id));
    if (queue.length) {
      enterSection(queue[0], queue.slice(1));
    } else {
      complete().catch(() => {
        // The completion function already reports the error to the user.
      });
    }
  };

  const advance = () => {
    if (!section || !question) {
      finishCurrentSection();
      return;
    }
    const answer = responses[responseKey(section.id, question.id)];
    if (!isAnswered(question, answer)) {
      setMessage("Үргэлжлүүлэхийн өмнө энэ асуултад хариулна уу.");
      return;
    }
    setMessage("");
    const selected = selectedIds(answer);
    const selectedOptions = question.options.filter((option) =>
      selected.has(option.id)
    );
    const nextQuestionId =
      selectedOptions
        .map((option) => option.nextQuestionId)
        .find((id) => section.questions.some((item) => item.id === id)) ??
      question.nextQuestionId;
    const nextSectionIds = [
      ...selectedOptions.map((option) => option.nextSectionId),
      question.nextSectionId,
    ].filter((id): id is string => Boolean(id));
    const hasRoutedConclusion =
      selectedOptions.some((option) => Boolean(option.conclusionId)) ||
      Boolean(question.conclusionId);
    const nextQuestion = nextQuestionId
      ? section.questions.find((item) => item.id === nextQuestionId)
      : undefined;
    if (nextQuestion) {
      setCurrentQuestionId(nextQuestion.id);
      return;
    }
    if (nextSectionIds.length) {
      const unique = nextSectionIds.filter(
        (id, index, all) => all.indexOf(id) === index
      );
      enterSection(unique[0], [...pendingSectionIds, ...unique.slice(1)]);
      return;
    }
    if (hasRoutedConclusion) {
      finishCurrentSection();
      return;
    }
    const sequential = section.questions[questionIndex + 1];
    if (sequential) {
      setCurrentQuestionId(sequential.id);
      return;
    }
    finishCurrentSection();
  };

  if (!root) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 text-sm">
        Үнэлгээний талбар алга байна.
      </div>
    );
  }

  return (
    <AppCard>
      <PageHero
        description={definition.summary}
        eyebrow={<Badge>Сэтгэлийн боловсрол · v{version}</Badge>}
        icon={definition.icon}
        title={definition.title}
      />
      {completed ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
            <Check className="mx-auto size-10 text-emerald-600" />
            <h2 className="mt-3 font-bold text-lg">Дүгнэлт</h2>
            <p className="mt-1 text-slate-600 text-sm">
              Таны хариултад тулгуурласан үр дүн.
            </p>
          </div>
          {results.length ? (
            results.map((result) => (
              <div
                className="rounded-2xl border border-blue-100 bg-blue-50 p-4"
                key={result.id}
              >
                <SectionHeading>{result.title}</SectionHeading>
                <p className="mt-2 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                  {result.body}
                </p>
                {result.recommendations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {result.recommendations.map((recommendation) => (
                      <a
                        className="block rounded-xl border border-blue-100 bg-white p-3 text-sm hover:bg-blue-50"
                        href={recommendation.href}
                        key={recommendation.id}
                      >
                        <b>{recommendation.title}</b>
                        <span className="mt-1 block text-slate-500 text-xs">
                          {recommendation.note}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-slate-600 text-sm">
              Энэ замд дүгнэлт хараахан нэмэгдээгүй байна.
            </p>
          )}
        </div>
      ) : section && question ? (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-blue-700 text-xs">
                {section.title}
              </p>
              <p className="mt-1 text-slate-500 text-xs">
                Асуулт {questionIndex + 1} / {section.questions.length}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 text-xs">
              {section.assessment?.method}
            </span>
          </div>
          <h2 className="font-bold text-lg leading-snug">{question.prompt}</h2>
          {question.description && (
            <p className="mt-2 text-slate-500 text-sm">
              {question.description}
            </p>
          )}
          <QuestionInput
            answer={responses[responseKey(section.id, question.id)]}
            onChange={(answer) =>
              setResponses((current) => ({
                ...current,
                [responseKey(section.id, question.id)]: answer,
              }))
            }
            question={question}
          />
          {message && (
            <p className="mt-3 font-medium text-red-600 text-sm">{message}</p>
          )}
          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
            onClick={advance}
            type="button"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Үргэлжлүүлэх <ChevronRight className="size-4" />
          </button>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">
          Энэ талбарт асуулт хараахан нэмээгүй байна.
        </p>
      )}
    </AppCard>
  );
}
