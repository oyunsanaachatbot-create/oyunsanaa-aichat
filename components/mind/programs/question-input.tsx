"use client";

import { matchingPairs } from "@/lib/programs/question-interactions";
import type { ProgramAnswer, ProgramQuestion } from "@/lib/programs/definition";
import { TextArea } from "@/components/mind/app-shell";

export function QuestionField({
  answer,
  onChange,
  question,
}: {
  answer: ProgramAnswer | undefined;
  onChange: (value: ProgramAnswer | undefined) => void;
  question: ProgramQuestion;
}) {
  const id = `program-question-${question.id}`;

  if (question.type === "TEXT" || question.type === "SCENARIO") {
    return (
      <TextArea
        aria-label={question.prompt}
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
        aria-label={question.prompt}
        id={id}
        max={question.max}
        min={question.min}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? undefined : Number(event.target.value)
          )
        }
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
          <b className="text-lg text-slate-900">
            {typeof answer === "number" ? value : "Сонгоогүй"}
          </b>
          <span>{question.maxLabel ?? max}</span>
        </div>
        <input
          className="w-full accent-blue-600"
          aria-valuetext={
            typeof answer === "number" ? String(value) : "Сонгоогүй"
          }
          aria-label={question.prompt}
          id={id}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={question.step ?? 1}
          type="range"
          value={value}
        />
        {typeof answer !== "number" && (
          <button
            type="button"
            className="mt-2 min-h-10 rounded-lg border px-3 text-sm"
            onClick={() => onChange(value)}
          >
            {value} гэж батлах
          </button>
        )}
        {typeof answer === "number" && (
          <button
            type="button"
            className="mt-2 min-h-10 rounded-lg border px-3 text-sm"
            onClick={() => onChange(undefined)}
          >
            Сонголт цэвэрлэх
          </button>
        )}
      </div>
    );
  }

  if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") {
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

  if (question.type === "ORDERING") {
    const known = new Set(question.options.map((option) => option.id));
    const selectedIds = Array.isArray(answer)
      ? [...new Set(answer.filter((value) => known.has(value)))]
      : [];
    const order = [
      ...selectedIds,
      ...question.options
        .map((option) => option.id)
        .filter((value) => !selectedIds.includes(value)),
    ];
    const reorder = (index: number, offset: number) => {
      const next = [...order];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      onChange(next);
    };
    return (
      <div className="space-y-3">
        <p className="text-slate-600 text-sm">
          Зүйлсийг зөв дарааллаар байрлуулна уу. Дээш/доош товчийг гарын Tab,
          Enter товчоор ашиглаж болно.
        </p>
        <ol className="space-y-2" aria-label={question.prompt}>
          {order.map((optionId, index) => (
            <li
              key={optionId}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <span className="font-bold" aria-hidden="true">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1 break-words">
                {
                  question.options.find((option) => option.id === optionId)
                    ?.label
                }
              </span>
              <button
                className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30"
                disabled={index === 0}
                aria-label={`${index + 1} дахь зүйлийг дээш`}
                type="button"
                onClick={() => reorder(index, -1)}
              >
                ↑
              </button>
              <button
                className="min-h-10 min-w-10 rounded-lg border disabled:opacity-30"
                disabled={index === order.length - 1}
                aria-label={`${index + 1} дахь зүйлийг доош`}
                type="button"
                onClick={() => reorder(index, 1)}
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
        <output aria-live="polite" className="block text-slate-600 text-sm">
          {selectedIds.length === question.options.length
            ? "Дараалал сонгогдсон"
            : "Дараалал батлаагүй"}
        </output>
        <button
          className="min-h-10 rounded-lg border px-3 text-sm"
          type="button"
          onClick={() => onChange(order)}
        >
          Энэ дарааллаар батлах
        </button>
      </div>
    );
  }

  if (question.type === "MATCHING" && question.interactionVersion === 2) {
    const pairs = matchingPairs(answer);
    const choices = [...question.options].reverse();
    return (
      <fieldset className="min-w-0 space-y-3">
        <legend className="text-slate-600 text-sm">
          Зүүн талын зүйл бүрт тохирох баруун талын утгыг сонгоно уу. Нэг утгыг
          давхар ашиглахгүй.
        </legend>
        {question.options.map((option) => (
          <label
            className="grid min-w-0 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2"
            key={option.id}
          >
            <span className="min-w-0 break-words">{option.label}</span>
            <select
              aria-label={`Хослуулах: ${option.label}`}
              className="min-h-10 min-w-0 max-w-full rounded-lg border px-2"
              value={pairs.get(option.id) ?? ""}
              onChange={(event) => {
                const next = new Map(pairs);
                if (event.target.value) next.set(option.id, event.target.value);
                else next.delete(option.id);
                onChange(
                  next.size
                    ? [...next].map(([left, right]) => `${left}=${right}`)
                    : undefined
                );
              }}
            >
              <option value="">Тохирох утга сонгох</option>
              {choices.map((right) => (
                <option
                  value={right.id}
                  key={right.id}
                  disabled={
                    pairs.get(option.id) !== right.id &&
                    [...pairs.values()].includes(right.id)
                  }
                >
                  {right.matchLabel}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
    );
  }

  const selected = Array.isArray(answer)
    ? [...new Set(answer)]
    : typeof answer === "string"
      ? [answer]
      : [];
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
