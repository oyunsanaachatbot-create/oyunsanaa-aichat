"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTodayKey,
  loadAllEntries,
  upsertEntry,
  type RelationsDailyEntry,
} from "@/lib/apps/relations/dailyCheckStorage";

type Scores = {
  listening: number;
  expression: number;
  empathy: number;
  mood: number;
};

const SCORE_MIN = 1;
const SCORE_MAX = 5;

function clamp(n: number) {
  if (!Number.isFinite(n)) return 3;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, n));
}

function avg(s: Scores) {
  return (s.listening + s.expression + s.empathy + s.mood) / 4;
}

function summary(entry: RelationsDailyEntry) {
  const a = avg(entry.scores);

  const dims = [
    { key: "Сонсох", val: entry.scores.listening },
    { key: "Илэрхийлэх", val: entry.scores.expression },
    { key: "Эмпати", val: entry.scores.empathy },
    { key: "Мэдрэмж", val: entry.scores.mood },
  ].sort((x, y) => y.val - x.val);

  const best = dims[0];
  const need = dims[dims.length - 1];

  let level = "сайжруулах боломжтой";
  if (a >= 4.3) level = "маш сайн";
  else if (a >= 3.6) level = "сайн";
  else if (a >= 2.8) level = "дунд";
  else level = "анхаарал хэрэгтэй";

  const who = entry.person?.trim() ? `Хэнтэй: ${entry.person.trim()}. ` : "";

  return `${who}Дундаж: ${a.toFixed(1)}/5 — ${level}. Хамгийн сайн: ${best.key} (${best.val}/5). Сайжруулах: ${need.key} (${need.val}/5).`;
}

export default function DailyRelationsCheck() {
  const [todayKey, setTodayKey] = useState("");
  const [entries, setEntries] = useState<RelationsDailyEntry[]>([]);

  const [person, setPerson] = useState("");
  const [scores, setScores] = useState<Scores>({
    listening: 3,
    expression: 3,
    empathy: 3,
    mood: 3,
  });

  const [feelingText, setFeelingText] = useState(""); // “Ямар мэдрэмж төрсөн бэ?”
  const [note, setNote] = useState(""); // нэмэлт тэмдэглэл
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    // client runtime дээр л өнөөдрийн key-г гаргана
    setTodayKey(getTodayKey());
  }, []);

  useEffect(() => {
    if (!todayKey) return;

    const all = loadAllEntries();
    setEntries(all);

    const today = all.find((e) => e.dateKey === todayKey);
    if (today) {
      setPerson(today.person ?? "");
      setScores({
        listening: clamp(today.scores.listening),
        expression: clamp(today.scores.expression),
        empathy: clamp(today.scores.empathy),
        mood: clamp(today.scores.mood),
      });
      setFeelingText(today.feelingText ?? "");
      setNote(today.note ?? "");
    }
  }, [todayKey]);

  const todayEntry: RelationsDailyEntry | null = useMemo(() => {
    if (!todayKey) return null;
    return {
      id: todayKey,
      dateKey: todayKey,
      person: person.trim(),
      scores: {
        listening: clamp(scores.listening),
        expression: clamp(scores.expression),
        empathy: clamp(scores.empathy),
        mood: clamp(scores.mood),
      },
      feelingText: feelingText.trim(),
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };
  }, [todayKey, person, scores, feelingText, note]);

  const last7 = useMemo(() => entries.slice(0, 7), [entries]);

  function setScore<K extends keyof Scores>(k: K, v: number) {
    setScores((p) => ({ ...p, [k]: clamp(v) }));
  }

  function save() {
    if (!todayEntry) return;
    const next = upsertEntry(todayEntry);
    setEntries(next);
    setShowSummary(true);
  }

  function loadEntry(e: RelationsDailyEntry) {
    setPerson(e.person ?? "");
    setScores({
      listening: clamp(e.scores.listening),
      expression: clamp(e.scores.expression),
      empathy: clamp(e.scores.empathy),
      mood: clamp(e.scores.mood),
    });
    setFeelingText(e.feelingText ?? "");
    setNote(e.note ?? "");
    setShowSummary(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!todayKey) return <div className="p-4 text-sm opacity-70">Ачаалж байна…</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        {/* ✅ Доторх гарчиг нь таны хүссэнээр */}
        <h1 className="text-xl md:text-2xl font-semibold">
          Өнөөдөр би яаж харилцав?
        </h1>
        <div className="text-sm opacity-70">
          Өдөрт 1 удаа бөглөөд, сүүлд нь дүгнэлтээ харна.
        </div>
      </header>

      <section className="rounded-2xl border p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="opacity-70">Өдөр:</span>{" "}
            <span className="font-medium">{todayKey}</span>
          </div>
          <div className="text-sm">
            <span className="opacity-70">Дундаж:</span>{" "}
            <span className="font-semibold">{todayEntry ? avg(todayEntry.scores).toFixed(1) : "—"}</span>
            <span className="opacity-70"> / 5</span>
          </div>
        </div>

        {/* Q1 */}
        <label className="space-y-1">
          <div className="text-sm font-medium">1) Өнөөдөр би хэнтэй хамгийн их харилцсан бэ?</div>
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Ж: Нөхөр, ээж, найз, ажлын хүн…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        {/* Q2-4 scores */}
        <ScoreRow
          title='2) Би түүнийг үнэхээр сонссон уу?'
          value={scores.listening}
          onChange={(v) => setScore("listening", v)}
        />
        <ScoreRow
          title='3) Би өөрийгөө илэрхийлж чадсан уу?'
          value={scores.expression}
          onChange={(v) => setScore("expression", v)}
        />
        <ScoreRow
          title='4) Би эмпати гаргаж чадсан уу?'
          value={scores.empathy}
          onChange={(v) => setScore("empathy", v)}
        />

        {/* Q5 mood: score + text */}
        <ScoreRow
          title='5) Ямар мэдрэмж төрсөн бэ? (оноо)'
          value={scores.mood}
          onChange={(v) => setScore("mood", v)}
        />

        <label className="space-y-1">
          <div className="text-sm font-medium">Мэдрэмжээ 1 өгүүлбэрээр</div>
          <input
            value={feelingText}
            onChange={(e) => setFeelingText(e.target.value)}
            placeholder="Ж: Гомдсон, тайван, ууртай, баяртай…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Нэмэлт тэмдэглэл (заавал биш)</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Юу хамгийн гол нь байсан бэ? Дараа нь юуг өөрөөр хийх вэ?"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <button
            onClick={save}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Хадгалах
          </button>

          <button
            onClick={() => setShowSummary((v) => !v)}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Дүгнэлт
          </button>
        </div>

        {showSummary && todayEntry && (
          <div className="rounded-xl border p-3 text-sm">
            <div className="font-medium mb-1">Сүүлчийн дүгнэлт</div>
            <div className="opacity-80">{summary(todayEntry)}</div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Сүүлийн 7 өдөр</h2>
          <div className="text-xs opacity-70">(товшоод нээж болно)</div>
        </div>

        {last7.length === 0 ? (
          <div className="text-sm opacity-70">Одоогоор бичлэг алга.</div>
        ) : (
          <div className="space-y-2">
            {last7.map((e) => (
              <button
                key={e.id}
                onClick={() => loadEntry(e)}
                className="w-full text-left rounded-xl border p-3 hover:bg-black/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{e.dateKey}</div>
                  <div className="text-sm">
                    {avg(e.scores).toFixed(1)} <span className="text-xs opacity-70">/5</span>
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {e.person ? `Хэнтэй: ${e.person}` : "Хэнтэй: (хоосон)"}
                </div>
                {e.feelingText ? (
                  <div className="text-xs opacity-70 mt-1 line-clamp-1">
                    Мэдрэмж: {e.feelingText}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ScoreRow({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs opacity-70">{value} / 5</div>
      </div>

      <input
        className="mt-2 w-full"
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-lg border px-2 py-1 text-xs ${n === value ? "font-semibold" : "opacity-80"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
