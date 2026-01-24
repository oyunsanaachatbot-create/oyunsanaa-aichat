"use client";

import { useEffect, useMemo, useState } from "react";

type FormState = {
  mood: number;
  energy: number;
  stress: number;
  anxiety: number;
  sleep_quality: number;
  note: string;
};

function calcScore(v: FormState) {
  const pos = (x: number) => x - 1; // 1..5 -> 0..4
  const neg = (x: number) => 5 - x; // reverse (stress/anxiety)

  const raw =
    pos(v.mood) * 3 +
    pos(v.energy) * 2 +
    pos(v.sleep_quality) * 2 +
    neg(v.stress) * 2 +
    neg(v.anxiety) * 1;

  return Math.round((raw / 40) * 100);
}

function levelFromScore(score: number) {
  if (score < 35) return { label: "Red", hint: "Өнөөдөр хамгаалалт хэрэгтэй." };
  if (score < 55) return { label: "Orange", hint: "Дунд–өндөр ачаалалтай." };
  if (score < 75) return { label: "Yellow", hint: "Дундаж, тогтворжуулахад сайн." };
  return { label: "Green", hint: "Тайван, боломжийн байна." };
}

function SliderRow({
  label,
  value,
  onChange,
  left,
  right,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  left: string;
  right: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm opacity-80">{value}/5</div>
      </div>

      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />

      <div className="flex items-center justify-between text-xs opacity-70">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

export default function DailyCheckForm() {
  const [date, setDate] = useState(""); // ✅ prerender safe
  const [state, setState] = useState<FormState>({
    mood: 3,
    energy: 3,
    stress: 3,
    anxiety: 3,
    sleep_quality: 3,
    note: "",
  });

  // ✅ зөвхөн client дээр огноо set хийнэ
  useEffect(() => {
    const d = new Date();
    setDate(d.toISOString().slice(0, 10));
  }, []);

  const score = useMemo(() => calcScore(state), [state]);
  const level = useMemo(() => levelFromScore(score), [score]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/mind/emotion/daily-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_date: date,
          ...state,
          tags: [],
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed");

      setMsg("Хадгаллаа.");
      window.dispatchEvent(new Event("daily-check:saved"));
    } catch (e: any) {
      setMsg(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white/5 backdrop-blur p-5 md:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Өнөөдрийн check</div>
          <div className="text-sm opacity-75">Өдөрт 1 удаа бөглөнө.</div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-semibold">{score}</div>
          <div className="text-xs opacity-80">{level.label}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm opacity-80">Огноо</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border bg-transparent px-3 py-2 text-sm"
        />
        <div className="ml-auto text-xs opacity-70">{level.hint}</div>
      </div>

      <SliderRow
        label="Сэтгэл санаа"
        value={state.mood}
        onChange={(v) => setState((s) => ({ ...s, mood: v }))}
        left="муу"
        right="маш сайн"
      />
      <SliderRow
        label="Энерги"
        value={state.energy}
        onChange={(v) => setState((s) => ({ ...s, energy: v }))}
        left="сул"
        right="өндөр"
      />
      <SliderRow
        label="Стресс"
        value={state.stress}
        onChange={(v) => setState((s) => ({ ...s, stress: v }))}
        left="бага"
        right="өндөр"
      />
      <SliderRow
        label="Түгшүүр"
        value={state.anxiety}
        onChange={(v) => setState((s) => ({ ...s, anxiety: v }))}
        left="бага"
        right="өндөр"
      />
      <SliderRow
        label="Нойрны чанар"
        value={state.sleep_quality}
        onChange={(v) => setState((s) => ({ ...s, sleep_quality: v }))}
        left="муу"
        right="сайн"
      />

      <div className="space-y-2">
        <div className="text-sm font-medium">Товч тэмдэглэл (заавал биш)</div>
        <textarea
          value={state.note}
          onChange={(e) => setState((s) => ({ ...s, note: e.target.value }))}
          rows={3}
          className="w-full rounded-xl border bg-transparent p-3 text-sm"
          placeholder="Ж: Өнөөдөр бага зэрэг ядруу, багахан түгшүүртэй..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving || !date}
          className="rounded-xl px-4 py-2 text-sm font-medium border bg-white/10 hover:bg-white/15 disabled:opacity-60"
        >
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
        {msg ? <div className="text-sm opacity-80">{msg}</div> : null}
      </div>
    </div>
  );
}
