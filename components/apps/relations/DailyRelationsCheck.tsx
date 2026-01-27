"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTodayKey,
  loadAllEntries,
  upsertEntry,
  type RelationsDailyEntry,
  type Pick,
  type Mood,
} from "@/lib/apps/relations/dailyCheckStorage";

const PICK_LABEL: Record<Pick, string> = {
  yes: "Тийм",
  some: "Заримдаа",
  no: "Үгүй",
};

const MOODS: Mood[] = ["😊", "🙂", "😐", "😕", "😣", "😡"];

function coach(entry: RelationsDailyEntry) {
  const l = entry.listening;
  const e = entry.expression;
  const m = entry.empathy;

  const rank = (p: Pick) => (p === "yes" ? 2 : p === "some" ? 1 : 0);

  const scores = [
    { k: "сонсох", v: l },
    { k: "өөрийгөө илэрхийлэх", v: e },
    { k: "эмпати", v: m },
  ].sort((a, b) => rank(a.v) - rank(b.v));

  const weakest = scores[0].k;

  let title = "Өнөөдрийн дүгнэлт";
  let one = "Маргааш 1 удаа: 60 сек таслахгүй сонсоод дараа нь асуулт асуугаарай.";

  if (weakest === "сонсох") {
    title = "Сонсох дээр жижиг алхам";
    one =
      "Маргааш 1 удаа: 60 сек таслахгүй сонсоод, дараа нь “Тэгэхээр чамд ___ санагдсан уу?” гэж давтаж асуу.";
  } else if (weakest === "өөрийгөө илэрхийлэх") {
    title = "Илэрхийлэл дээр жижиг алхам";
    one =
      "Маргааш 1 удаа: “Би ___ үед, ___ мэдэрсэн. Учир нь ___. Тиймээс ___ хүсэж байна.” гэж 1 өгүүлбэр хэл.";
  } else if (weakest === "эмпати") {
    title = "Эмпати дээр жижиг алхам";
    one =
      "Маргааш 1 удаа: “Чи ингэж мэдэрсэн юм байна” гэж нэг өгүүлбэрээр буцааж хэлээд үз.";
  }

  const overview =
    (entry.person ? `Хэнтэй: ${entry.person}. ` : "") +
    (entry.mood ? `Мэдрэмж: ${entry.mood}` : "");

  return { title, overview, one };
}

export default function DailyRelationsCheck() {
  const [todayKey, setTodayKey] = useState("");
  const [entries, setEntries] = useState<RelationsDailyEntry[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [person, setPerson] = useState("");
  const [listening, setListening] = useState<Pick>("some");
  const [expression, setExpression] = useState<Pick>("some");
  const [empathy, setEmpathy] = useState<Pick>("some");
  const [mood, setMood] = useState<Mood | undefined>();
  const [note, setNote] = useState("");

  const [showCoach, setShowCoach] = useState(true);

  useEffect(() => setTodayKey(getTodayKey()), []);

  useEffect(() => {
    if (!todayKey) return;
    const all = loadAllEntries();
    setEntries(all);

    const today = all.find((e) => e.dateKey === todayKey);
    if (today) {
      setPerson(today.person ?? "");
      setListening(today.listening);
      setExpression(today.expression);
      setEmpathy(today.empathy);
      setMood(today.mood);
      setNote(today.note ?? "");
      setSavedAt(today.updatedAt ?? null);
    }
  }, [todayKey]);

  const todayEntry: RelationsDailyEntry | null = useMemo(() => {
    if (!todayKey) return null;
    return {
      id: todayKey,
      dateKey: todayKey,
      person: person.trim(),
      listening,
      expression,
      empathy,
      mood,
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };
  }, [todayKey, person, listening, expression, empathy, mood, note]);

  const c = useMemo(() => (todayEntry ? coach(todayEntry) : null), [todayEntry]);

  function save() {
    if (!todayEntry) return;
    const next = upsertEntry(todayEntry);
    setEntries(next);
    setSavedAt(todayEntry.updatedAt ?? null);
    setShowCoach(true);
  }

  function loadEntry(e: RelationsDailyEntry) {
    setPerson(e.person ?? "");
    setListening(e.listening);
    setExpression(e.expression);
    setEmpathy(e.empathy);
    setMood(e.mood);
    setNote(e.note ?? "");
    setSavedAt(e.updatedAt ?? null);
    setShowCoach(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!todayKey) return <div className="p-4 text-sm opacity-70">Ачаалж байна…</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold">Өнөөдөр би яаж харилцав?</h1>

      <section className="rounded-2xl border p-4 space-y-4">
        <div className="text-sm">Өдөр: {todayKey}</div>

        <input
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Хэнтэй?"
          className="w-full rounded-xl border px-3 py-2"
        />

        <PickRow title="Би түүнийг үнэхээр сонссон уу?" value={listening} onChange={setListening} />
        <PickRow title="Би өөрийгөө илэрхийлж чадсан уу?" value={expression} onChange={setExpression} />
        <PickRow title="Би эмпати гаргаж чадсан уу?" value={empathy} onChange={setEmpathy} />

        <MoodRow value={mood} onChange={setMood} />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Нэмэлт тэмдэглэл"
          className="w-full rounded-xl border px-3 py-2"
        />

        <button onClick={save} className="rounded-xl border px-4 py-2">
          Хадгалах
        </button>

        {showCoach && c && (
          <div className="rounded-xl border p-3 text-sm">
            <div className="font-semibold">{c.title}</div>
            <div>{c.overview}</div>
            <div className="mt-1">{c.one}</div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold mb-2">Сүүлийн 7 өдөр</h2>
        {entries.slice(0, 7).map((e) => (
          <button key={e.id} onClick={() => loadEntry(e)} className="block w-full text-left border p-2 mb-2">
            {e.dateKey} — Сонсох: {PICK_LABEL[e.listening]}
          </button>
        ))}
      </section>
    </div>
  );
}

function PickRow({ title, value, onChange }: { title: string; value: Pick; onChange: (v: Pick) => void }) {
  return (
    <div>
      <div className="text-sm mb-1">{title}</div>
      <div className="flex gap-2">
        {(["yes", "some", "no"] as const).map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`border rounded px-3 py-1 ${value === k ? "font-bold" : ""}`}
          >
            {PICK_LABEL[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodRow({ value, onChange }: { value?: Mood; onChange: (v?: Mood) => void }) {
  return (
    <div>
      <div className="text-sm mb-1">Ямар мэдрэмж төрсөн бэ?</div>
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`border rounded px-2 ${value === m ? "font-bold" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
