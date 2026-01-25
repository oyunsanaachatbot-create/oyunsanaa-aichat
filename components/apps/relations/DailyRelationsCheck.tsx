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
  boundaries: number;
};

const SCORE_MIN = 1;
const SCORE_MAX = 5;

function clampScore(n: number) {
  if (Number.isNaN(n)) return SCORE_MIN;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, n));
}

function avgScore(s: Scores) {
  const total = s.listening + s.expression + s.empathy + s.boundaries;
  return total / 4;
}

function summaryText(entry: RelationsDailyEntry) {
  const a = avgScore(entry.scores);

  const { listening, expression, empathy, boundaries } = entry.scores;

  const strongest = [
    { k: "Сонсох", v: listening },
    { k: "Өөрийгөө илэрхийлэх", v: expression },
    { k: "Эмпати", v: empathy },
    { k: "Хил хязгаар", v: boundaries },
  ].sort((x, y) => y.v - x.v);

  const weakest = strongest[strongest.length - 1];

  let level = "тэнцвэртэй";
  if (a >= 4.3) level = "маш сайн";
  else if (a >= 3.6) level = "сайн";
  else if (a >= 2.8) level = "сайжруулах боломжтой";
  else level = "анхаарал хэрэгтэй";

  return `Өнөөдрийн дундаж: ${a.toFixed(1)} / 5 — ${level}. Хамгийн сайн: ${
    strongest[0]?.k
  } (${strongest[0]?.v}/5). Хамгийн сайжруулах: ${weakest.k} (${weakest.v}/5).`;
}

export default function DailyRelationsCheck() {
  const todayKey = useMemo(() => getTodayKey(), []);
  const [loading, setLoading] = useState(true);

  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");

  const [scores, setScores] = useState<Scores>({
    listening: 3,
    expression: 3,
    empathy: 3,
    boundaries: 3,
  });

  const [entries, setEntries] = useState<RelationsDailyEntry[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Load saved
  useEffect(() => {
    const all = loadAllEntries();
    setEntries(all);

    const today = all.find((e) => e.dateKey === todayKey);
    if (today) {
      setPerson(today.person ?? "");
      setNote(today.note ?? "");
      setScores({
        listening: today.scores.listening,
        expression: today.scores.expression,
        empathy: today.scores.empathy,
        boundaries: today.scores.boundaries,
      });
      setSavedAt(today.updatedAt ?? null);
    }

    setLoading(false);
  }, [todayKey]);

  const last7 = useMemo(() => {
    return entries.slice(0, 7);
  }, [entries]);

  const todayEntry: RelationsDailyEntry = useMemo(
    () => ({
      id: `${todayKey}`,
      dateKey: todayKey,
      person: person.trim(),
      note: note.trim(),
      scores: {
        listening: clampScore(scores.listening),
        expression: clampScore(scores.expression),
        empathy: clampScore(scores.empathy),
        boundaries: clampScore(scores.boundaries),
      },
      updatedAt: new Date().toISOString(),
    }),
    [note, person, scores, todayKey]
  );

  const canSave = useMemo(() => {
    // person can be empty (some users won't want to specify), so only validate scores
    const s = todayEntry.scores;
    const ok =
      s.listening >= 1 &&
      s.expression >= 1 &&
      s.empathy >= 1 &&
      s.boundaries >= 1;
    return ok;
  }, [todayEntry.scores]);

  function setScore<K extends keyof Scores>(key: K, value: number) {
    setScores((prev) => ({ ...prev, [key]: clampScore(value) }));
  }

  function handleSave() {
    if (!canSave) return;

    const updated = upsertEntry(todayEntry);
    setEntries(updated);
    setSavedAt(todayEntry.updatedAt ?? null);
    setShowSummary(true);
  }

  function handleLoadEntry(e: RelationsDailyEntry) {
    setPerson(e.person ?? "");
    setNote(e.note ?? "");
    setScores({
      listening: e.scores.listening,
      expression: e.scores.expression,
      empathy: e.scores.empathy,
      boundaries: e.scores.boundaries,
    });
    setSavedAt(e.updatedAt ?? null);
    setShowSummary(true);
    // Jump to top for convenience
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-sm opacity-70">Ачаалж байна…</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold">
          Өдөр тутмын харилцааны шалгалт
        </h1>
        <div className="text-sm opacity-70">
          Өдөрт 1 удаа бөглөөд, өөрийн харилцааны дадлыг ажиглаарай.
        </div>
      </header>

      {/* Form */}
      <section className="rounded-2xl border p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="text-sm">
            <span className="opacity-70">Өдөр:</span>{" "}
            <span className="font-medium">{todayKey}</span>
          </div>

          <div className="text-xs opacity-70">
            {savedAt ? `Сүүлд хадгалсан: ${new Date(savedAt).toLocaleString()}` : "Одоогоор хадгалагдаагүй"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div className="text-sm font-medium">Өнөөдөр хэнтэй их харилцсан бэ? (заавал биш)</div>
            <input
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Ж: Нөхөр, Ээж, Ажлын хүн…"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            />
          </label>

          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium mb-2">Өнөөдрийн дундаж</div>
            <div className="text-2xl font-semibold">
              {avgScore(todayEntry.scores).toFixed(1)}
              <span className="text-sm font-normal opacity-70"> / 5</span>
            </div>
            <div className="text-xs opacity-70 mt-1">
              (4 шалгуурын дундаж)
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ScoreRow
            label="Сонсох"
            value={scores.listening}
            onChange={(v) => setScore("listening", v)}
          />
          <ScoreRow
            label="Өөрийгөө илэрхийлэх"
            value={scores.expression}
            onChange={(v) => setScore("expression", v)}
          />
          <ScoreRow
            label="Эмпати"
            value={scores.empathy}
            onChange={(v) => setScore("empathy", v)}
          />
          <ScoreRow
            label="Хил хязгаар"
            value={scores.boundaries}
            onChange={(v) => setScore("boundaries", v)}
          />
        </div>

        <label className="space-y-1">
          <div className="text-sm font-medium">Тэмдэглэл</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Юу болсон бэ? Юуг өөрөөр хийх байсан бэ?"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
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

        {showSummary && (
          <div className="rounded-xl border p-3 text-sm">
            <div className="font-medium mb-1">Өнөөдрийн дүгнэлт</div>
            <div className="opacity-80">{summaryText(todayEntry)}</div>
          </div>
        )}
      </section>

      {/* Recent */}
      <section className="rounded-2xl border p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Сүүлийн 7 өдөр</h2>
          <div className="text-xs opacity-70">
            (Өдөр бүр 1 бичлэг)
          </div>
        </div>

        {last7.length === 0 ? (
          <div className="text-sm opacity-70">Одоогоор бичлэг алга.</div>
        ) : (
          <div className="space-y-2">
            {last7.map((e) => (
              <button
                key={e.id}
                onClick={() => handleLoadEntry(e)}
                className="w-full text-left rounded-xl border p-3 hover:bg-black/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{e.dateKey}</div>
                  <div className="text-sm">
                    {avgScore(e.scores).toFixed(1)}{" "}
                    <span className="text-xs opacity-70">/ 5</span>
                  </div>
                </div>

                <div className="text-xs opacity-70 mt-1">
                  {e.person ? `Хэнтэй: ${e.person}` : "Хэнтэй: (хоосон)"}
                </div>

                {e.note ? (
                  <div className="text-xs opacity-70 mt-1 line-clamp-2">
                    {e.note}
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
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-70">{value} / 5</div>
      </div>

      <input
        className="mt-2 w-full"
        type="range"
        min={SCORE_MIN}
        max={SCORE_MAX}
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
            className={`rounded-lg border px-2 py-1 text-xs ${
              n === value ? "font-semibold" : "opacity-80"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
