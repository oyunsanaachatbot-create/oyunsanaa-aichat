"use client";

import * as React from "react";

type MoodEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  mood: number; // 0-10
  energy: number; // 0-10
  stress: number; // 0-10
  note: string;
  createdAt: number;
};

const STORAGE_KEY = "mind_emotion_daily_check_v1";

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MoodEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: MoodEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function DailyCheckPage() {
  const [entries, setEntries] = React.useState<MoodEntry[]>([]);
  const [date, setDate] = React.useState<string>(todayYYYYMMDD());
  const [mood, setMood] = React.useState<number>(6);
  const [energy, setEnergy] = React.useState<number>(6);
  const [stress, setStress] = React.useState<number>(4);
  const [note, setNote] = React.useState<string>("");

  React.useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const existingForDate = React.useMemo(
    () => entries.find((e) => e.date === date),
    [entries, date]
  );

  function upsertEntry() {
    const id = existingForDate?.id ?? crypto.randomUUID();
    const newEntry: MoodEntry = {
      id,
      date,
      mood,
      energy,
      stress,
      note: note.trim(),
      createdAt: existingForDate?.createdAt ?? Date.now(),
    };

    const next = [
      newEntry,
      ...entries.filter((e) => e.date !== date),
    ].sort((a, b) => b.createdAt - a.createdAt);

    setEntries(next);
    saveEntries(next);
  }

  function deleteEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  React.useEffect(() => {
    // date-аа сольсон үед тухайн өдрийн өмнөх бичлэг байвал form-д суулгах
    if (!existingForDate) return;
    setMood(existingForDate.mood);
    setEnergy(existingForDate.energy);
    setStress(existingForDate.stress);
    setNote(existingForDate.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingForDate?.id]);

  const last7 = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return entries.filter((e) => e.createdAt >= cutoff);
  }, [entries]);

  const avg = React.useMemo(() => {
    if (last7.length === 0) return null;
    const sum = last7.reduce(
      (acc, e) => {
        acc.mood += e.mood;
        acc.energy += e.energy;
        acc.stress += e.stress;
        return acc;
      },
      { mood: 0, energy: 0, stress: 0 }
    );
    return {
      mood: Math.round((sum.mood / last7.length) * 10) / 10,
      energy: Math.round((sum.energy / last7.length) * 10) / 10,
      stress: Math.round((sum.stress / last7.length) * 10) / 10,
    };
  }, [last7]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-semibold">
        Өдрийн сэтгэл санааны тест (check)
      </h1>
      <p className="mt-2 text-sm opacity-80">
        Өдөр бүр 1–2 минут бөглөвөл сэтгэл санааныхаа хэлбэлзлийг өөрөө “харах”
        боломжтой болно. (Энд хадгалалт нь одоогоор таны төхөөрөмж дээр хадгалагдана.)
      </p>

      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <label className="text-sm font-medium">Огноо</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {existingForDate ? (
              <p className="mt-1 text-xs opacity-70">
                Энэ өдөр өмнө нь бөглөсөн байна — шинэчилж хадгалж болно.
              </p>
            ) : (
              <p className="mt-1 text-xs opacity-70">
                Энэ өдөр шинэ check үүсгэнэ.
              </p>
            )}
          </div>

          <button
            onClick={upsertEntry}
            className="rounded-xl border px-4 py-2 font-medium"
          >
            Хадгалах
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Slider label="Сэтгэл санаа (0–10)" value={mood} onChange={setMood} />
          <Slider label="Эрч хүч (0–10)" value={energy} onChange={setEnergy} />
          <Slider label="Стресс (0–10)" value={stress} onChange={setStress} />

          <div>
            <label className="text-sm font-medium">Товч тэмдэглэл (заавал биш)</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Өнөөдөр юу хамгийн их нөлөөлөв?"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <h2 className="text-lg font-semibold">Сүүлийн 7 хоногийн тойм</h2>
        {avg ? (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Stat title="Дундаж сэтгэл санаа" value={avg.mood} />
            <Stat title="Дундаж эрч хүч" value={avg.energy} />
            <Stat title="Дундаж стресс" value={avg.stress} />
          </div>
        ) : (
          <p className="mt-2 text-sm opacity-80">Одоогоор өгөгдөл алга.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <h2 className="text-lg font-semibold">Сүүлийн бичлэгүүд</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm opacity-80">Одоогоор бичлэг алга.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {entries.slice(0, 12).map((e) => (
              <li key={e.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{e.date}</div>
                    <div className="mt-1 text-sm opacity-80">
                      Сэтгэл: {e.mood} · Эрч: {e.energy} · Стресс: {e.stress}
                    </div>
                    {e.note ? (
                      <div className="mt-2 text-sm">{e.note}</div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => deleteEntry(e.id)}
                    className="rounded-lg border px-3 py-1 text-sm"
                  >
                    Устгах
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm opacity-80">{value}</span>
      </div>
      <input
        className="mt-2 w-full"
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-sm opacity-80">{title}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
