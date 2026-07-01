"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BALANCE_AREAS,
  type BalanceAreaKey,
  type BalancePercents,
  saveRun,
} from "@/lib/mind/who-am-i-balance";
import {
  BalanceDiagram,
  BALANCE_VIZ_CAPTIONS,
  type BalanceVizMode,
} from "./balance-diagram";
import {
  APP_SHELL_TOKENS,
  Badge,
  Button,
  Muted,
  PageHero,
  SectionHeading,
  TextArea,
} from "@/components/mind/app-shell";

const { BRAND, INK, MUTED, LINE } = APP_SHELL_TOKENS;

type Screen = "intro" | "area" | "test";

const EVEN: BalancePercents = { body: 25, work: 25, bond: 25, meaning: 25 };

const FIELD_DOTS: Array<{
  key: BalanceAreaKey;
  hex: string;
  title: string;
  subtitle: string;
}> = [
  { key: "body",    hex: "#7E9B6E", title: "Бие махбод",    subtitle: "Эрүүл мэнд, мэдрэхүй" },
  { key: "work",    hex: "#C28A3C", title: "Ажил · Амжилт", subtitle: "Карьер, сурлага, санхүү" },
  { key: "bond",    hex: "#C36C71", title: "Харилцаа",       subtitle: "Гэр бүл, найз, өөрөө" },
  { key: "meaning", hex: "#6E6CA3", title: "Ирээдүй · Утга", subtitle: "Зорилго, итгэл, мөрөөдөл" },
];

export function BalanceExercise() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("intro");
  const [areaIdx, setAreaIdx] = useState(0);
  const [notes, setNotes] = useState<Record<BalanceAreaKey, string>>({
    body: "", work: "", bond: "", meaning: "",
  });
  const [pct, setPct] = useState<BalancePercents>({ ...EVEN });
  const [vizMode, setVizMode] = useState<BalanceVizMode>("platform");

  const area = BALANCE_AREAS[Math.min(areaIdx, BALANCE_AREAS.length - 1)];
  const sum = pct.body + pct.work + pct.bond + pct.meaning;
  const isOk = sum === 100;

  const onNextArea = () => {
    if (areaIdx >= BALANCE_AREAS.length - 1) { setScreen("test"); return; }
    setAreaIdx((i) => Math.min(i + 1, BALANCE_AREAS.length - 1));
  };
  const onPrevArea = () => {
    if (areaIdx > 0) setAreaIdx((i) => Math.max(i - 1, 0));
  };
  const onSlide = (key: BalanceAreaKey, value: number) =>
    setPct((prev) => ({ ...prev, [key]: value }));
  const onSubmit = () => {
    if (!isOk) return;
    saveRun({ at: Date.now(), pct, notes, change: "" });
    router.push("/mind/who-am-i/conclusion");
  };

  return (
    <div className="wai-balance w-full">
      {/* Range input reset — keeps thumb styled without messy Tailwind hacks */}
      <style>{`
        .wai-balance input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:28px;width:100%}
        .wai-balance input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:#E2E8F0}
        .wai-balance input[type=range]::-moz-range-track{height:5px;border-radius:99px;background:#E2E8F0}
        .wai-balance input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid currentColor;margin-top:-7.5px;box-shadow:0 1px 4px rgba(0,0,0,.12)}
        .wai-balance input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid currentColor;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      `}</style>

      {/* ── INTRO ───────────────────────────────────────── */}
      {screen === "intro" && (
        <section>
          <PageHero
            icon="⚖️"
            eyebrow={<Badge>Балансын загвар · Н. Пезешкиан</Badge>}
            title={
              <>
                Амьдралын{" "}
                <em className="not-italic" style={{ color: "#6E6CA3" }}>
                  тэнцвэр
                </em>
              </>
            }
            description="Эерэг ба соёл хоорондын сэтгэл засал нь амьдралын энергийг дөрвөн талбарт хуваан үздэг. Энэ нам гүм дасгал танд аль талбартаа илүү автаж, алийг нь орхигдуулж байгаагаа олж харахад тусална."
          />

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FIELD_DOTS.map((f) => (
              <div
                className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
                key={f.key}
                style={{ borderColor: LINE, background: "#FAFBFD" }}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: f.hex }}
                />
                <div>
                  <b className="block font-semibold text-sm" style={{ color: INK }}>
                    {f.title}
                  </b>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {f.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setScreen("area")} type="button">
              Эхлэх →
            </Button>
            <span className="text-xs" style={{ color: MUTED }}>
              ~5 минут
            </span>
          </div>

          <p className="mt-5 text-xs" style={{ color: MUTED }}>
            Таны хариулт зөвхөн энэ дэлгэц дээр, таны мэдэлд үлдэнэ — хаашаа ч
            хадгалагдаж, илгээгдэхгүй.
          </p>
        </section>
      )}

      {/* ── AREA ────────────────────────────────────────── */}
      {screen === "area" && (
        <section>
          {/* Progress bar */}
          <div className="mb-6 flex gap-1.5">
            {BALANCE_AREAS.map((a, i) => (
              <div
                className="h-1 flex-1 overflow-hidden rounded-full"
                key={a.key}
                style={{ background: LINE }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: i <= areaIdx ? "100%" : "0%",
                    background: a.hex,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Area header */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className="grid size-11 shrink-0 place-items-center rounded-[12px] text-white"
              style={{ background: area.hex }}
            >
              <span className="font-bold text-sm">{areaIdx + 1}</span>
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: MUTED }}>
                {area.tag}
              </div>
              <div className="font-bold text-xl leading-tight" style={{ color: INK }}>
                {area.title}
              </div>
            </div>
          </div>
          <Muted className="mb-4">{area.desc}</Muted>

          {/* Questions */}
          <div
            className="overflow-hidden rounded-[14px] border"
            style={{ borderColor: LINE }}
          >
            {area.questions.map((q, i) => (
              <div
                className="flex gap-3 px-4 py-3.5"
                key={q}
                style={{
                  borderBottom:
                    i < area.questions.length - 1
                      ? `1px solid ${LINE}`
                      : "none",
                  background: "#FAFBFD",
                }}
              >
                <span
                  className="w-5 shrink-0 font-medium text-sm"
                  style={{ color: MUTED }}
                >
                  {i + 1}
                </span>
                <p className="m-0 text-sm leading-relaxed" style={{ color: INK }}>
                  {q}
                </p>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="mt-4">
            <label
              className="mb-1.5 block text-xs font-medium"
              htmlFor="area-note"
              style={{ color: MUTED }}
            >
              Энэ талбар дээр бодогдсон зүйлээ тэмдэглэе (заавал биш)
            </label>
            <TextArea
              id="area-note"
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [area.key]: e.target.value }))
              }
              placeholder="Чөлөөтэй бичээрэй…"
              style={{ minHeight: 84 }}
              value={notes[area.key]}
            />
          </div>

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              onClick={onPrevArea}
              style={{ visibility: areaIdx === 0 ? "hidden" : "visible" }}
              type="button"
              variant="ghost"
            >
              ← Буцах
            </Button>
            <Button onClick={onNextArea} type="button">
              {areaIdx === BALANCE_AREAS.length - 1
                ? "Балансын тест →"
                : "Үргэлжлүүлэх →"}
            </Button>
          </div>
        </section>
      )}

      {/* ── TEST ────────────────────────────────────────── */}
      {screen === "test" && (
        <section>
          <SectionHeading className="mb-1">Энергиэ хуваарилаарай</SectionHeading>
          <Muted className="mb-4">
            Одоогийн байдлаар цаг, энергиэ эдгээр дөрвөн талбарт хэдэн хувиар
            зарцуулж байгаагаа гулсуураар тааруулна уу. Нийлбэр нь{" "}
            <b style={{ color: INK }}>100%</b> болох ёстой.
          </Muted>

          {/* Diagram */}
          <div
            className="mb-5 rounded-[16px] border p-4"
            style={{ borderColor: LINE, background: "#FAFBFD" }}
          >
            <div className="mb-3 flex justify-center">
              <div
                className="inline-flex gap-0.5 rounded-full p-1"
                style={{ background: "#EEF2F8", border: `1px solid ${LINE}` }}
              >
                {(["kite", "platform", "auras"] as BalanceVizMode[]).map((m) => (
                  <button
                    className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                    key={m}
                    onClick={() => setVizMode(m)}
                    style={
                      vizMode === m
                        ? { background: BRAND, color: "#fff" }
                        : { color: MUTED }
                    }
                    type="button"
                  >
                    {m === "kite"
                      ? "◇ Ромб"
                      : m === "platform"
                        ? "⤧ Тавцан"
                        : "✦ Туяа"}
                  </button>
                ))}
              </div>
            </div>
            <BalanceDiagram
              className="mx-auto h-auto w-full max-w-[300px]"
              mode={vizMode}
              pct={pct}
            />
            <div className="mt-1.5 text-center text-xs" style={{ color: MUTED }}>
              {BALANCE_VIZ_CAPTIONS[vizMode]}
            </div>
          </div>

          {/* Sliders */}
          <div className="mb-5 grid gap-5">
            {BALANCE_AREAS.map((a) => (
              <div key={a.key} style={{ color: a.hex }}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: a.hex }}
                    />
                    <span className="font-medium text-sm" style={{ color: INK }}>
                      {a.title}
                    </span>
                  </div>
                  <span className="font-bold text-lg" style={{ color: INK }}>
                    {pct[a.key]}%
                  </span>
                </div>
                <input
                  max={100}
                  min={0}
                  onChange={(e) =>
                    onSlide(a.key, Number.parseInt(e.target.value, 10))
                  }
                  type="range"
                  value={pct[a.key]}
                />
              </div>
            ))}
          </div>

          {/* Sum indicator */}
          <div
            className="flex items-center justify-between rounded-[14px] border px-4 py-3 text-sm"
            style={
              isOk
                ? {
                    background: "rgba(126,155,110,0.08)",
                    borderColor: "#9DB58D",
                  }
                : { borderColor: LINE, background: "#FAFBFD" }
            }
          >
            <span style={{ color: INK }}>
              Нийлбэр: <b className="text-base">{sum}</b>%{" "}
              <span style={{ color: MUTED }}>
                {isOk
                  ? "· бэлэн ✓"
                  : sum < 100
                    ? `· ${100 - sum}% дутуу`
                    : `· ${sum - 100}% илүү`}
              </span>
            </span>
            <button
              className="rounded-full px-3 py-1.5 text-xs transition-all hover:opacity-70"
              onClick={() => setPct({ ...EVEN })}
              style={{ color: MUTED }}
              type="button"
            >
              25% тус бүр
            </button>
          </div>

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              onClick={() => setScreen("area")}
              type="button"
              variant="ghost"
            >
              ← Буцах
            </Button>
            <Button disabled={!isOk} onClick={onSubmit} type="button">
              Дүгнэлт харах →
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
