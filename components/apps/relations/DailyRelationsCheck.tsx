"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTodayKey,
  loadAllEntries,
  upsertEntry,
  type RelationsDailyEntry,
} from "../../../lib/apps/relations/dailyCheckStorage";

type Scores = {
  listening: number;
  expression: number;
  empathy: number;
  boundaries: number;
};

const SCORE_MIN = 1;
const SCORE_MAX = 5;

function clamp(n: number) {
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, n));
}

function avg(s: Scores) {
  return (s.listening + s.expression + s.empathy + s.boundaries) / 4;
}

export default function DailyRelationsCheck() {
  const [todayKey, setTodayKey] = useState<string>("");

  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [scores, setScores] = useState<Scores>({
    listening: 3,
    expression: 3,
    empathy: 3,
    boundaries: 3,
  });

  const [entries, setEntries] = useState<RelationsDailyEntry[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // runtime-д өнөөдрийг тогтооно
  useEffect(() => {
    setTodayKey(getTodayKey());
  }, []);

  useEffect(() => {
    if (!todayKey) return;
    const all = loadAllEntries();
    setEntries(all);

    const today = all.find((e) => e.dateKey === todayKey);
    if (today) {
      setPerson(today.person ?? "");
      setNote(today.note ?? "");
      setScores(today.scores);
    }
  }, [todayKey]);

  const todayEntry: RelationsDailyEntry | null = useMemo(() => {
    if (!todayKey) return null;
    return {
      id: todayKey,
      dateKey: todayKey,
      person,
      note,
      scores: {
        listening: clamp(scores.listening),
        expression: clamp(scores.expression),
        empathy: clamp(scores.empathy),
        boundaries: clamp(scores.boundaries),
      },
      updatedAt: new Date().toISOString(),
    };
  }, [todayKey, person, note, scores]);

  function save() {
    if (!todayEntry) return;
    const next = upsertEntry(todayEntry);
    setEntries(next);
    setShowSummary(true);
  }

  if (!todayKey) return <div className="p-4">Ачаалж байна…</div>;

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-semibold">Өдөр тутмын харилцааны шалгалт</h1>

      <div className="border rounded-xl p-3 space-y-3">
        <div className="text-sm">Өдөр: {todayKey}</div>

        <input
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Хэнтэй их харилцсан бэ?"
          className="border rounded w-full p-2 text-sm"
        />

        {(["listening","expression","empathy","boundaries"] as const).map(k => (
          <div key={k}>
            <div className="text-sm">{k}</div>
            <input
              type="range"
              min={1}
              max={5}
              value={scores[k]}
              onChange={(e) =>
                setScores({ ...scores, [k]: Number(e.target.value) })
              }
            />
          </div>
        ))}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Тэмдэглэл"
          className="border rounded w-full p-2 text-sm"
        />

        <button
          onClick={save}
          className="border rounded px-4 py-2 text-sm"
        >
          Хадгалах
        </button>

        {showSummary && todayEntry && (
          <div className="text-sm">
            Дундаж: {avg(todayEntry.scores).toFixed(1)} / 5
          </div>
        )}
      </div>
    </div>
  );
}
