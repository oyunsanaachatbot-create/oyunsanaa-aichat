"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTodayKey,
  loadAllEntries,
  upsertEntry,
  type RelationsDailyEntry,
} from "@/lib/apps/relations/dailyCheckStorage";

type Pick = "yes" | "some" | "no";
type Mood = "😊" | "🙂" | "😐" | "😕" | "😣" | "😡";

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

  // хамгийн сайжруулахыг сонгоно
  const scores = [
    { k: "сонсох", v: l },
    { k: "өөрийгөө илэрхийлэх", v: e },
    { k: "эмпати", v: m },
  ];

  // yes > some > no
  const rank = (p: Pick) => (p === "yes" ? 2 : p === "some" ? 1 : 0);
  scores.sort((a, b) => rank(a.v) - rank(b.v)); // хамгийн сул нь эхэнд

  const weakest = scores[0]?.k;

  let title = "Өнөөдрийн дүгнэлт";
  let one = "Маргааш 1 удаа: 60 сек таслахгүй сонсоод дараа нь асуулт асуугаарай.";

  if (weakest === "сонсох") {
    title = "Сонсох дээр жижиг алхам";
    one = "Маргааш 1 удаа: 60 сек таслахгүй сонсоод, дараа нь “Тэгэхээр чамд ___ санагдсан уу?” гэж давтаж асуу.";
  } else if (weakest === "өөрийгөө илэрхийлэх") {
    title = "Илэрхийлэл дээр жижиг алхам";
    one = "Маргааш 1 удаа: “Би ___ үед, ___ мэдэрсэн. Учир нь ___. Тиймээс ___ хүсэж байна.” гэж 1 өгүүлбэр хэл.";
  } else if (weakest === "эмпати") {
    title = "Эмпати дээр жижиг алхам";
    one = "Маргааш 1 удаа: “Чи ингэж мэдэрсэн юм байна” гэж нэг өгүүлбэрээр буцааж хэлээд үз.";
  }

  const moodLine = entry.mood ? `Мэдрэмж: ${entry.mood}` : "";
  const whoLine = entry.person?.trim() ? `Хэнтэй: ${entry.person.trim()}. ` : "";

  const overview =
    `${whoLine}${moodLine}`.trim() ||
    "Чи өнөөдрийн харилцаагаа ажигласан нь өөрөө том алхам.";

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
  const [mood, setMood] = useState<Mood | "">("");
  const [note, setNote] = useState("");

  const [showCoach, setShowCoach] = useState(true);

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
      setListening(today.listening ?? "some");
      setExpression(today.expression ?? "some");
      setEmpathy(today.empathy ?? "some");
      setMood((today.mood as any) ?? "");
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
      mood: mood || undefined,
      note: note.trim(),
      updatedAt: new Date().toISOString(),
    };
  }, [todayKey, person, listening, expression, empathy, mood, note]);

  const canSave = true; // сонголтууд бүгд default-тэй, шууд хадгалж болно

  const last7 = useMemo(() => entries.slice(0, 7), [entries]);

  const c = useMemo(() => (todayEntry ? coach(todayEntry) : null), [todayEntry]);

  function save() {
    if (!todayEntry || !canSave) return;
    const next = upsertEntry(todayEntry);
    setEntries(next);
    setSavedAt(todayEntry.updatedAt ?? null);
    setShowCoach(true);
  }

  function loadEntry(e: RelationsDailyEntry) {
    setPerson(e.person ?? "");
    setListening(e.listening ?? "some");
    setExpression(e.expression ?? "some");
    setEmpathy(e.empathy ?? "some");
    setMood((e.mood as any) ?? "");
    setNote(e.note ?? "");
    setSavedAt(e.updatedAt ?? null);
    setShowCoach(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!todayKey) return <div className="p-4 text-sm opacity-70">Ачаалж байна…</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold">Өнөөдөр би яаж харилцав?</h1>
        <div className="text-sm opacity-70">
          1 минут. Сонголтоор бөглөнө. Дараа нь Оюунсанаа жижиг алхам санал болгоно.
        </div>
      </header>

      <section className="rounded-2xl border p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="text-sm">
            <span className="opacity-70">Өдөр:</span>{" "}
            <span className="font-medium">{todayKey}</span>
          </div>
          <div className="text-xs opacity-70">
            {savedAt ? `Сүүлд хадгалсан: ${new Date(savedAt).toLocaleString()}` : "Одоогоор хадгалаагүй"}
          </div>
        </div>

        <label className="space-y-1">
          <div className="text-sm font-medium">Өнөөдөр хэнтэй хамгийн их харилцсан бэ? (заавал биш)</div>
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Ж: Нөхөр, ээж, найз, ажлын хүн…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        <PickRow
          title="Би түүнийг үнэхээр сонссон уу?"
          value={listening}
          onChange={setListening}
        />

        <PickRow
          title="Би өөрийгөө илэрхийлж чадсан уу?"
          value={expression}
          onChange={setExpression}
        />

        <PickRow
          title="Би эмпати гаргаж чадсан уу?"
          value={empathy}
          onChange={setEmpathy}
        />

        <MoodRow value={mood} onChange={setMood} />

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
            onClick={() => setShowCoach((v) => !v)}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Оюунсанаа дүгнэлт
          </button>
        </div>

        {showCoach && c && (
          <div className="rounded-2xl border p-4 space-y-2 text-sm">
            <div className="font-semibold">{c.title}</div>
            <div className="opacity-80">{c.overview}</div>
            <div className="opacity-80">
              <span className="font-medium">Өнөөдрийн 1 алхам:</span> {c.one}
            </div>
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
                  <div className="text-xs opacity-70">
                    {e.mood ? `Мэдрэмж: ${e.mood}` : ""}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  Сонсох: {PICK_LABEL[e.listening ?? "some"]} · Илэрхийлэх:{" "}
                  {PICK_LABEL[e.expression ?? "some"]} · Эмпати:{" "}
                  {PICK_LABEL[e.empathy ?? "some"]}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PickRow({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Pick;
  onChange: (v: Pick) => void;
}) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="grid grid-cols-3 gap-2">
        {(["yes", "some", "no"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={`rounded-xl border px-3 py-2 text-sm ${
              value === k ? "font-semibold" : "opacity-80"
            }`}
          >
            {PICK_LABEL[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodRow({
  value,
  onChange,
}: {
  value: Mood | "";
  onChange: (v: Mood | "") => void;
}) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="text-sm font-medium mb-2">Ямар мэдрэмж төрсөн бэ?</div>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded-xl border px-3 py-2 text-base ${
              value === m ? "font-semibold" : "opacity-80"
            }`}
            aria-label={m}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-xl border px-3 py-2 text-sm opacity-80"
        >
          Арилгах
        </button>
      </div>
    </div>
  );
}
