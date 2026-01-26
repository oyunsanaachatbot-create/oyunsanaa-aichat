"use client";

import { useMemo, useState } from "react";
import { artifact as PUR_GOAL_ORGANIZE } from "@/content/mind/purpose/goal-organize";

type GoalDomain =
  | "Self"
  | "Харилцаа"
  | "Ажил/Мөнгө"
  | "Эрүүл мэнд"
  | "Утга учир"
  | "Аз жаргал";

type GoalWho = "Зөвхөн би" | "Гэр бүл" | "Хос" | "Ажил" | "Нийгэм";
type GoalRange = "1–4 долоо хоног" | "1–3 сар" | "3–12 сар" | "1–10 жил";
type GoalFreq = "Өдөр" | "7 хоног" | "Сар";
type GoalTime = "15 мин" | "30 мин" | "1 цаг" | "2 цаг" | "3 цаг+";

export default function GoalOrganizePage() {
  const [domain, setDomain] = useState<GoalDomain>("Утга учир");
  const [who, setWho] = useState<GoalWho>("Зөвхөн би");
  const [range, setRange] = useState<GoalRange>("3–12 сар");
  const [freq, setFreq] = useState<GoalFreq>("Өдөр");
  const [time, setTime] = useState<GoalTime>("2 цаг");

  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [files, setFiles] = useState<
    Array<{ id: string; title: string; why?: string; meta: any }>
  >([]);

  const budget = useMemo(() => {
    // rough calc to show “Өдөр: x, 7 хоног: y, 1 сар: z”
    const minutesMap: Record<GoalTime, number> = {
      "15 мин": 15,
      "30 мин": 30,
      "1 цаг": 60,
      "2 цаг": 120,
      "3 цаг+": 180,
    };
    const m = minutesMap[time] ?? 0;

    let perWeek = 0;
    if (freq === "Өдөр") perWeek = m * 7;
    if (freq === "7 хоног") perWeek = m * 1;
    if (freq === "Сар") perWeek = Math.round((m * 12) / 52); // approx

    const perDay = Math.round(perWeek / 7);
    const perMonth = Math.round((perWeek * 52) / 12);

    const fmt = (min: number) => {
      const h = Math.floor(min / 60);
      const mm = min % 60;
      if (h <= 0) return `${mm} мин`;
      if (mm === 0) return `${h} цаг`;
      return `${h}ц ${mm}м`;
    };

    return {
      day: fmt(perDay),
      week: fmt(perWeek),
      month: fmt(perMonth),
    };
  }, [freq, time]);

  const addFile = () => {
    const t = title.trim();
    if (!t) return;

    setFiles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: t,
        why: why.trim() || undefined,
        meta: { domain, who, range, freq, time },
      },
    ]);
    setTitle("");
    setWhy("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">🧩 Зорилго цэгцлэх</h1>
        <p className="text-sm text-muted-foreground">
          Зүүн талд бөглөж, баруун талд заавар/ойлголтоо харна.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* LEFT: APP */}
        <div className="space-y-6">
          {/* one-line “test-like” row */}
          <div className="rounded-xl border bg-white p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <select
                className="h-11 w-full rounded-md border px-3"
                value={who}
                onChange={(e) => setWho(e.target.value as GoalWho)}
              >
                {["Зөвхөн би", "Гэр бүл", "Хос", "Ажил", "Нийгэм"].map((x) => (
                  <option key={x} value={x}>
                    Хэнтэй? · {x}
                  </option>
                ))}
              </select>

              <select
                className="h-11 w-full rounded-md border px-3"
                value={domain}
                onChange={(e) => setDomain(e.target.value as GoalDomain)}
              >
                {[
                  "Self",
                  "Харилцаа",
                  "Ажил/Мөнгө",
                  "Эрүүл мэнд",
                  "Утга учир",
                  "Аз жаргал",
                ].map((x) => (
                  <option key={x} value={x}>
                    Юуны? · {x}
                  </option>
                ))}
              </select>

              <select
                className="h-11 w-full rounded-md border px-3"
                value={range}
                onChange={(e) => setRange(e.target.value as GoalRange)}
              >
                {["1–4 долоо хоног", "1–3 сар", "3–12 сар", "1–10 жил"].map(
                  (x) => (
                    <option key={x} value={x}>
                      Хугацаа · {x}
                    </option>
                  )
                )}
              </select>

              <select
                className="h-11 w-full rounded-md border px-3"
                value={freq}
                onChange={(e) => setFreq(e.target.value as GoalFreq)}
              >
                {["Өдөр", "7 хоног", "Сар"].map((x) => (
                  <option key={x} value={x}>
                    Давтамж · {x}
                  </option>
                ))}
              </select>

              <select
                className="h-11 w-full rounded-md border px-3"
                value={time}
                onChange={(e) => setTime(e.target.value as GoalTime)}
              >
                {["15 мин", "30 мин", "1 цаг", "2 цаг", "3 цаг+"].map((x) => (
                  <option key={x} value={x}>
                    Цаг · {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              Миний цагны төсөв: Өдөрт <b>{budget.day}</b> · 7 хоногт{" "}
              <b>{budget.week}</b> · 1 сард <b>{budget.month}</b>
            </div>
          </div>

          {/* write */}
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 font-medium">Зорилго бичих</div>
            <input
              className="h-11 w-full rounded-md border px-3"
              placeholder="Ж: Сард 100 сая орлоготой болох…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="mt-3 min-h-[110px] w-full rounded-md border p-3"
              placeholder="Яагаад энэ чухал вэ? (заавал биш)"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
            <button
              onClick={addFile}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1F6FB2] px-5 text-white"
            >
              Хадгалах
            </button>
          </div>

          {/* files list (title-only visible) */}
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">Миний зорилгууд</div>
              <div className="text-sm text-muted-foreground">
                Нийт: {files.length}
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Одоогоор зорилго байхгүй. Дээрээс бичээд “Хадгалах” дар.
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="truncate">{f.title}</div>
                    <button
                      className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-gray-50"
                      onClick={() =>
                        setFiles((prev) => prev.filter((x) => x.id !== f.id))
                      }
                      title="Устгах"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button className="mt-4 h-11 w-full rounded-md bg-[#1F6FB2] text-white">
              🧠 Бүгдийг тооцоолж цэгцлэх
            </button>
          </div>
        </div>

        {/* RIGHT: ARTIFACT PANEL */}
        <aside className="rounded-xl border bg-white p-5">
          <div className="mb-2 text-sm text-muted-foreground">Заавар</div>
          <h2 className="text-xl font-semibold">{PUR_GOAL_ORGANIZE.title}</h2>
          <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap">
            {PUR_GOAL_ORGANIZE.content}
          </div>
        </aside>
      </div>
    </div>
  );
}
