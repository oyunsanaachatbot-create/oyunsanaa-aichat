"use client";

import * as React from "react";

type StressEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  intensity: number; // 0-10
  trigger: string;
  body: string;
  thought: string;
  action: string;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = "mind_emotion_stress_progress_v1";

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadEntries(): StressEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StressEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: StressEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function StressProgressPage() {
  const [entries, setEntries] = React.useState<StressEntry[]>([]);
  const [date, setDate] = React.useState<string>(todayYYYYMMDD());
  const [intensity, setIntensity] = React.useState<number>(5);
  const [trigger, setTrigger] = React.useState("");
  const [body, setBody] = React.useState("");
  const [thought, setThought] = React.useState("");
  const [action, setAction] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setEntries(loadEntries());
  }, []);

  function addEntry() {
    const e: StressEntry = {
      id: crypto.randomUUID(),
      date,
      intensity,
      trigger: trigger.trim(),
      body: body.trim(),
      thought: thought.trim(),
      action: action.trim(),
      note: note.trim(),
      createdAt: Date.now(),
    };
    const next = [e, ...entries].sort((a, b) => b.createdAt - a.createdAt);
    setEntries(next);
    saveEntries(next);

    // reset жижиг
    setTrigger("");
    setBody("");
    setThought("");
    setAction("");
    setNote("");
    setIntensity(5);
  }

  function deleteEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  const last7 = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return entries.filter((e) => e.createdAt >= cutoff);
  }, [entries]);

  const avgIntensity = React.useMemo(() => {
    if (last7.length === 0) return null;
    const sum = last7.reduce((acc, e) => acc + e.intensity, 0);
    return Math.round((sum / last7.length) * 10) / 10;
  }, [last7]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-semibold">Стресс ажиглах тэмдэглэл</h1>
      <p className="mt-2 text-sm opacity-80">
        Энэ нь эмчилгээний зөвлөгөө биш. Зүгээр л “өөрийгөө ажиглах” тэмдэглэл.
        Бичих тусам стрессийн давтамж, өдөөгч хүчин зүйл тодорхой болж эхэлдэг.
      </p>

      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Огноо</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Стрессийн хүч (0–10)</label>
              <span className="text-sm opacity-80">{intensity}</span>
            </div>
            <input
              className="mt-2 w-full"
              type="range"
              min={0}
              max={10}
              step={1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Юу өдөөв? (trigger)" value={trigger} onChange={setTrigger} placeholder="Ж: ажил дээр хэлсэн үг, мессеж, ядаргаа..." />
          <Field label="Биеэр яаж мэдрэгдэв?" value={body} onChange={setBody} placeholder="Ж: мөр чангарсан, амьсгаа давчдсан..." />
          <Field label="Толгойд орж ирсэн бодол" value={thought} onChange={setThought} placeholder="Ж: “Би дийлэхгүй”, “Намайг үнэлэхгүй байна”..." />
          <Field label="Би юу хийв? / юу хиймээр санагдав?" value={action} onChange={setAction} placeholder="Ж: дуугүй болсон, уурласан, алхсан, амьсгал хийсэн..." />

          <div>
            <label className="text-sm font-medium">Нэмэлт тэмдэглэл</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Жижиг дүгнэлт, дараагийн удаа өөрөөр яаж хандах вэ?"
            />
          </div>

          <button onClick={addEntry} className="rounded-xl border px-4 py-2 font-medium">
            Хадгалах
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <h2 className="text-lg font-semibold">Сүүлийн 7 хоногийн тойм</h2>
        {avgIntensity === null ? (
          <p className="mt-2 text-sm opacity-80">Одоогоор өгөгдөл алга.</p>
        ) : (
          <p className="mt-2 text-sm opacity-80">
            Дундаж стрессийн хүч: <span className="font-medium">{avgIntensity}</span> (0–10)
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <h2 className="text-lg font-semibold">Бичлэгүүд</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm opacity-80">Одоогоор бичлэг алга.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {entries.slice(0, 20).map((e) => (
              <li key={e.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {e.date} · Стресс: {e.intensity}/10
                    </div>
                    <div className="mt-2 text-sm">
                      {e.trigger ? <p><span className="opacity-70">Өдөөгч:</span> {e.trigger}</p> : null}
                      {e.body ? <p><span className="opacity-70">Бие:</span> {e.body}</p> : null}
                      {e.thought ? <p><span className="opacity-70">Бодол:</span> {e.thought}</p> : null}
                      {e.action ? <p><span className="opacity-70">Үйлдэл:</span> {e.action}</p> : null}
                      {e.note ? <p className="mt-1">{e.note}</p> : null}
                    </div>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
