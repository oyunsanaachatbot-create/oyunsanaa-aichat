"use client";

import { useMemo, useState } from "react";
import { artifact as PUR_GOAL_ORGANIZE } from "@/content/mind/purpose/goal-organize";
import {
  AppCard,
  AppShell,
  Badge,
  Button,
  EmptyState,
  Field,
  Muted,
  Prose,
  SectionHeading,
  TextArea,
  TextInput,
} from "@/components/mind/app-shell";

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

const SELECT_CLASS =
  "h-11 w-full rounded-[14px] border bg-white px-3.5 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15";
const SELECT_STYLE = { borderColor: "#E2E8F0", color: "#0F172A" } as const;

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
    <AppShell
      title="Зорилго цэгцлэх"
      subtitle="Зүүн талд бөглөж, баруун талд зааврыг харна"
      width="4xl"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_.9fr]">
        {/* LEFT: APP */}
        <div className="space-y-4">
          {/* one-line “test-like” row */}
          <AppCard>
            <SectionHeading className="mb-3">Хүрээ тодорхойлох</SectionHeading>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              <select
                className={SELECT_CLASS}
                style={SELECT_STYLE}
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
                className={SELECT_CLASS}
                style={SELECT_STYLE}
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
                className={SELECT_CLASS}
                style={SELECT_STYLE}
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
                className={SELECT_CLASS}
                style={SELECT_STYLE}
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
                className={SELECT_CLASS}
                style={SELECT_STYLE}
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

            <div
              className="mt-3 rounded-[14px] px-3.5 py-2.5 text-sm"
              style={{ background: "rgba(31,111,178,0.06)", color: "#334155" }}
            >
              Миний цагны төсөв: Өдөрт <b>{budget.day}</b> · 7 хоногт{" "}
              <b>{budget.week}</b> · 1 сард <b>{budget.month}</b>
            </div>
          </AppCard>

          {/* write */}
          <AppCard>
            <SectionHeading className="mb-3">Зорилго бичих</SectionHeading>
            <div className="space-y-3">
              <TextInput
                placeholder="Ж: Сард 100 сая орлоготой болох…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextArea
                rows={4}
                placeholder="Яагаад энэ чухал вэ? (заавал биш)"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
              />
              <Button onClick={addFile} disabled={!title.trim()}>
                Хадгалах
              </Button>
            </div>
          </AppCard>

          {/* files list (title-only visible) */}
          <AppCard>
            <div className="mb-3 flex items-center justify-between">
              <SectionHeading>Миний зорилгууд</SectionHeading>
              <Muted className="text-xs">Нийт: {files.length}</Muted>
            </div>

            {files.length === 0 ? (
              <EmptyState icon="🎯">
                Одоогоор зорилго байхгүй. Дээрээс бичээд “Хадгалах” дар.
              </EmptyState>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-[14px] border px-3.5 py-2.5"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <div className="truncate text-sm">{f.title}</div>
                    <button
                      className="shrink-0 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-slate-50"
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

            <Button className="mt-4 w-full">🧠 Бүгдийг тооцоолж цэгцлэх</Button>
          </AppCard>
        </div>

        {/* RIGHT: ARTIFACT PANEL */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AppCard>
            <Badge className="mb-2.5">Заавар</Badge>
            <h2 className="font-bold text-lg tracking-tight" style={{ color: "#0F172A" }}>
              {PUR_GOAL_ORGANIZE.title}
            </h2>
            <Prose className="mt-4">{PUR_GOAL_ORGANIZE.content}</Prose>
          </AppCard>
        </aside>
      </div>
    </AppShell>
  );
}
