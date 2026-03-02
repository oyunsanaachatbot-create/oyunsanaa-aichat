"use client";

import React from "react";

type Mode = "guest" | "authed";

type Program = {
  bmi?: number;
  normalMin?: number;
  normalMax?: number;
  excessKg?: number;
  daysToGoal?: number;
  dailyCalories?: number;
  proteinPercent?: number;
  fatPercent?: number;
  carbPercent?: number;
  sleepRecommended?: number;
  waterRecommended?: number;
  stepsRecommended?: number;
} | null;

type Props = {
  mode: Mode;
  program: Program;
  onRestart: () => void;

  // optional nav actions (HealthAppClient дээр байвал холбоно)
  onStartQuestionnaire?: () => void;
  onOpenDaily?: () => void;
  onOpenReport?: () => void;
};

export default function Dashboard({
  mode,
  program,
  onRestart,
  onStartQuestionnaire,
  onOpenDaily,
  onOpenReport,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur border border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Эрүүл мэнд · Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Горим:{" "}
              <span className="font-medium">
                {mode === "guest" ? "Guest (түр)" : "Login (хадгална)"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onRestart}
            className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Дахин эхлүүлэх
          </button>
        </div>

        {/* Program summary */}
        <div className="mt-4 rounded-xl bg-slate-50/80 border border-slate-100 p-4">
          {program ? (
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Өдөрт ккал</div>
                <div className="font-semibold text-slate-900">
                  {program.dailyCalories ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">BMI</div>
                <div className="font-semibold text-slate-900">
                  {program.bmi ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Алхалт</div>
                <div className="font-semibold text-slate-900">
                  {program.stepsRecommended
                    ? `${program.stepsRecommended.toLocaleString()} /өдөр`
                    : "-"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Одоогоор хөтөлбөрийн тооцоо алга байна. Эхлээд асуумжаа бөглөнө үү.
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onStartQuestionnaire}
            className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-left hover:bg-sky-100 transition"
          >
            <div className="text-sm font-semibold text-slate-900">
              1) Асуумж бөглөх
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Суурь мэдээлэл → дүгнэлт
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenDaily}
            className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-left hover:bg-emerald-100 transition"
          >
            <div className="text-sm font-semibold text-slate-900">
              2) Өдөр бүр бүртгэх
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Хоол/ус/нойр/алхалт
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-left hover:bg-slate-100 transition"
          >
            <div className="text-sm font-semibold text-slate-900">3) Тайлан</div>
            <div className="text-xs text-slate-600 mt-1">
              Макро тэнцвэр, зөвлөмж
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
