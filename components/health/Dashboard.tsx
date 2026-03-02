"use client";

import React from "react";

type Props = {
  // дараа нь бодит дата холбохдоо өргөтгөнө
  onStartQuestionnaire?: () => void;
  onOpenDaily?: () => void;
  onOpenReport?: () => void;
};

export default function Dashboard({
  onStartQuestionnaire,
  onOpenDaily,
  onOpenReport,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900">
          Эрүүл мэнд · Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Асуумжаа бөглөж эхлээд, дараа нь өдөр тутмын хоол/ус/нойр/хөдөлгөөнийг
          бүртгэж, тайлангаас макро тэнцвэрээ хялбар харна.
        </p>

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
              Суурь мэдээлэл → дүгнэлт, зорилт
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenDaily}
            className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-left hover:bg-emerald-100 transition"
          >
            <div className="text-sm font-semibold text-slate-900">
              2) Өдөр тутмын бүртгэл
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Хоол/ус/нойр/амралт/алхалт
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-left hover:bg-slate-100 transition"
          >
            <div className="text-sm font-semibold text-slate-900">
              3) Тайлан
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Макро, илүүдэл/дутмаг, зөвлөмж
            </div>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">
          Дараагийн алхам
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          <li>• Асуумж бөглөөд → Summary гарна</li>
          <li>• Өдөр тутам хоолоо гараар/зурагтай оруулна</li>
          <li>• Тайланд “өнөөдөр уураг/нүүрс ус/өөх тос” хэтэрсэн эсэхийг харуулна</li>
        </ul>
      </div>
    </div>
  );
}
