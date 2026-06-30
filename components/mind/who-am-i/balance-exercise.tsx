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

type Screen = "intro" | "area" | "test";

const EVEN: BalancePercents = { body: 25, work: 25, bond: 25, meaning: 25 };

const FIELD_DOTS: Array<{
  key: BalanceAreaKey;
  hex: string;
  title: string;
  subtitle: string;
}> = [
  {
    key: "body",
    hex: "#7E9B6E",
    title: "Бие махбод",
    subtitle: "Эрүүл мэнд, мэдрэхүй",
  },
  {
    key: "work",
    hex: "#C28A3C",
    title: "Ажил · Амжилт",
    subtitle: "Карьер, сурлага, санхүү",
  },
  {
    key: "bond",
    hex: "#C36C71",
    title: "Харилцаа",
    subtitle: "Гэр бүл, найз, өөрөө",
  },
  {
    key: "meaning",
    hex: "#6E6CA3",
    title: "Ирээдүй · Утга",
    subtitle: "Зорилго, итгэл, мөрөөдөл",
  },
];

export function BalanceExercise() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("intro");
  const [areaIdx, setAreaIdx] = useState(0);
  const [notes, setNotes] = useState<Record<BalanceAreaKey, string>>({
    body: "",
    work: "",
    bond: "",
    meaning: "",
  });
  const [pct, setPct] = useState<BalancePercents>({ ...EVEN });
  const [vizMode, setVizMode] = useState<BalanceVizMode>("platform");

  const area = BALANCE_AREAS[Math.min(areaIdx, BALANCE_AREAS.length - 1)];
  const sum = pct.body + pct.work + pct.bond + pct.meaning;
  const isOk = sum === 100;

  const onNextArea = () => {
    if (areaIdx >= BALANCE_AREAS.length - 1) {
      setScreen("test");
      return;
    }
    setAreaIdx((i) => Math.min(i + 1, BALANCE_AREAS.length - 1));
  };
  const onPrevArea = () => {
    if (areaIdx > 0) {
      setAreaIdx((i) => Math.max(i - 1, 0));
    }
  };

  const onSlide = (key: BalanceAreaKey, value: number) => {
    setPct((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = () => {
    if (!isOk) {
      return;
    }
    saveRun({
      at: Date.now(),
      pct,
      notes,
      change: "",
    });
    router.push("/mind/who-am-i/conclusion");
  };

  return (
    <div
      className="wai-balance mx-auto w-full max-w-[600px]"
      style={{
        color: "#2C2A24",
        fontFamily: "Inter, system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        .wai-serif{font-family:'Alegreya',serif}
        .wai-balance input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:30px;width:100%}
        .wai-balance input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:99px;background:#D3CBB9}
        .wai-balance input[type=range]::-moz-range-track{height:6px;border-radius:99px;background:#D3CBB9}
        .wai-balance input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid currentColor;margin-top:-8px;box-shadow:0 2px 6px rgba(0,0,0,.15)}
        .wai-balance input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid currentColor;box-shadow:0 2px 6px rgba(0,0,0,.15)}
      `}</style>

      {screen === "intro" && (
        <section>
          <p
            className="m-0 mb-3.5 font-semibold text-[11.5px] uppercase tracking-[.22em]"
            style={{ color: "#6A655B" }}
          >
            Балансын загвар · Н. Пезешкиан
          </p>
          <h1 className="wai-serif m-0 mb-4 text-[34px] leading-[1.06] tracking-tight sm:text-[46px]">
            Алдаж болохгүй амьдралын{" "}
            <em
              className="not-italic"
              style={{ color: "#6E6CA3", fontStyle: "italic" }}
            >
              тэнцвэр
            </em>
          </h1>
          <p className="m-0 mb-2 text-[16.5px]" style={{ color: "#46423a" }}>
            Эерэг ба соёл хоорондын сэтгэл засал нь амьдралын энергийг дөрвөн
            талбарт хуваан үздэг. Энэ нам гүм дасгал танд аль талбартаа илүү
            автаж, алийг нь орхигдуулж байгаагаа олж харахад тусална.
          </p>
          <p className="m-0 mb-2 text-[16.5px]" style={{ color: "#6A655B" }}>
            Яаралгүй, өөртөө үнэнчээр хариулаарай.
          </p>

          <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELD_DOTS.map((f) => (
              <div
                className="flex items-center gap-3 rounded-2xl border p-4"
                key={f.key}
                style={{ background: "#FAF7F0", borderColor: "#E1DACB" }}
              >
                <span
                  className="size-[11px] shrink-0 rounded-full"
                  style={{ background: f.hex }}
                />
                <div>
                  <b className="block font-semibold text-sm">{f.title}</b>
                  <span className="text-[11.5px]" style={{ color: "#6A655B" }}>
                    {f.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="hover:-translate-y-0.5 rounded-full px-6 py-3.5 font-semibold text-[15px] transition-transform"
              onClick={() => setScreen("area")}
              style={{ background: "#2C2A24", color: "#F7F4ED" }}
              type="button"
            >
              Эхлэх →
            </button>
            <span className="ml-1.5 text-[13px]" style={{ color: "#6A655B" }}>
              ~5 минут
            </span>
          </div>

          <div
            className="mt-6 flex items-start gap-2 text-[12.5px]"
            style={{ color: "#6A655B" }}
          >
            <span>
              Таны хариулт зөвхөн энэ дэлгэц дээр, таны мэдэлд үлдэнэ — хаашаа ч
              хадгалагдаж, илгээгдэхгүй.
            </span>
          </div>
        </section>
      )}

      {screen === "area" && (
        <section>
          <div className="mb-6 flex gap-2">
            {BALANCE_AREAS.map((a, i) => (
              <div
                className="h-[5px] flex-1 overflow-hidden rounded-full"
                key={a.key}
                style={{ background: "#D3CBB9" }}
              >
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: i <= areaIdx ? "100%" : "0%",
                    background: a.hex,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mb-2 flex items-center gap-3.5">
            <div
              className="grid size-[50px] shrink-0 place-items-center rounded-2xl text-white"
              style={{ background: area.hex }}
            >
              <span className="font-semibold text-lg">{areaIdx + 1}</span>
            </div>
            <div>
              <div
                className="font-semibold text-xs"
                style={{ color: "#6A655B" }}
              >
                {area.tag}
              </div>
              <div className="wai-serif font-medium text-[27px] leading-[1.1]">
                {area.title}
              </div>
            </div>
          </div>
          <p className="mt-1 mb-5 text-[15px]" style={{ color: "#4f4a40" }}>
            {area.desc}
          </p>

          <div>
            {area.questions.map((q, i) => (
              <div
                className="flex gap-3.5 border-t py-4"
                key={q}
                style={{ borderColor: "#E1DACB" }}
              >
                <span
                  className="wai-serif w-5 shrink-0 text-[19px] italic"
                  style={{ color: "#6A655B" }}
                >
                  {i + 1}
                </span>
                <p className="m-0 text-[15.5px]">{q}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label
              className="mb-2 block font-semibold text-[13px]"
              htmlFor="area-note"
              style={{ color: "#6A655B" }}
            >
              Энэ талбар дээр бодогдсон зүйлээ тэмдэглэе (заавал биш)
            </label>
            <textarea
              className="w-full resize-y rounded-2xl border p-3.5 text-[15px] leading-[1.55] outline-none"
              id="area-note"
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [area.key]: e.target.value }))
              }
              placeholder="Чөлөөтэй бичээрэй…"
              style={{
                minHeight: 88,
                background: "#FAF7F0",
                borderColor: "#D3CBB9",
                color: "#2C2A24",
              }}
              value={notes[area.key]}
            />
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              className="rounded-full px-4.5 py-3.5 font-semibold text-[15px]"
              onClick={onPrevArea}
              style={{
                color: "#6A655B",
                visibility: areaIdx === 0 ? "hidden" : "visible",
              }}
              type="button"
            >
              ← Буцах
            </button>
            <button
              className="hover:-translate-y-0.5 rounded-full px-6 py-3.5 font-semibold text-[15px] transition-transform"
              onClick={onNextArea}
              style={{ background: "#2C2A24", color: "#F7F4ED" }}
              type="button"
            >
              {areaIdx === BALANCE_AREAS.length - 1
                ? "Балансын тест →"
                : "Үргэлжлүүлэх →"}
            </button>
          </div>
        </section>
      )}

      {screen === "test" && (
        <section>
          <p
            className="m-0 mb-3.5 font-semibold text-[11.5px] uppercase tracking-[.22em]"
            style={{ color: "#6A655B" }}
          >
            Балансын тест
          </p>
          <h1 className="wai-serif m-0 mb-4 text-[28px] sm:text-[36px]">
            Энергиэ хуваарилаарай
          </h1>
          <p className="m-0 mb-2 text-[16.5px]" style={{ color: "#6A655B" }}>
            Одоогийн байдлаар цаг, энергиэ эдгээр дөрвөн талбарт хэдэн хувиар
            зарцуулж байгаагаа гулсуураар тааруулна уу. Нийлбэр нь <b>100%</b>{" "}
            болох ёстой.
          </p>

          <div
            className="mx-auto mt-4 mb-1.5 rounded-[22px] border p-4.5 text-center"
            style={{ background: "#FAF7F0", borderColor: "#E1DACB" }}
          >
            <div
              className="mx-auto mb-1 inline-flex gap-1 rounded-full border p-1"
              style={{ background: "#F3EFE6", borderColor: "#E1DACB" }}
            >
              {(["kite", "platform", "auras"] as BalanceVizMode[]).map((m) => (
                <button
                  className="rounded-full px-3.5 py-1.5 font-semibold text-[12.5px] transition-colors"
                  key={m}
                  onClick={() => setVizMode(m)}
                  style={
                    vizMode === m
                      ? { background: "#2C2A24", color: "#FAF7F0" }
                      : { color: "#6A655B" }
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
            <BalanceDiagram
              className="mx-auto h-auto w-full max-w-[360px]"
              mode={vizMode}
              pct={pct}
            />
            <div className="mt-0.5 text-[11.5px]" style={{ color: "#6A655B" }}>
              {BALANCE_VIZ_CAPTIONS[vizMode]}
            </div>
          </div>

          <div className="my-6 grid gap-5">
            {BALANCE_AREAS.map((a) => (
              <div
                className="grid grid-cols-[1fr_auto] items-center gap-1.5"
                key={a.key}
                style={{ color: a.hex }}
              >
                <div className="flex items-center gap-2.5 font-medium text-[14.5px]">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: a.hex }}
                  />
                  <span style={{ color: "#2C2A24" }}>{a.title}</span>
                </div>
                <div
                  className="wai-serif min-w-[54px] text-right font-semibold text-[21px]"
                  style={{ color: "#2C2A24" }}
                >
                  {pct[a.key]}%
                </div>
                <input
                  className="col-span-2"
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

          <div
            className="mt-5 flex items-center justify-between gap-3 rounded-2xl border px-4.5 py-3.5 text-sm"
            style={
              isOk
                ? { background: "#F0F4EA", borderColor: "#9DB58D" }
                : { background: "#FAF7F0", borderColor: "#E1DACB" }
            }
          >
            <span>
              Нийлбэр: <b className="wai-serif text-[20px]">{sum}</b>%{" "}
              <span style={{ color: "#6A655B" }}>
                {isOk
                  ? "· бэлэн"
                  : sum < 100
                    ? `· ${100 - sum}% дутуу`
                    : `· ${sum - 100}% илүү`}
              </span>
            </span>
            <button
              className="rounded-full px-3.5 py-2 font-semibold text-[15px]"
              onClick={() => setPct({ ...EVEN })}
              style={{ color: "#6A655B" }}
              type="button"
            >
              25% тус бүр
            </button>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              className="rounded-full px-4.5 py-3.5 font-semibold text-[15px]"
              onClick={() => setScreen("area")}
              style={{ color: "#6A655B" }}
              type="button"
            >
              ← Буцах
            </button>
            <button
              className="hover:-translate-y-0.5 rounded-full px-6 py-3.5 font-semibold text-[15px] transition-transform disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!isOk}
              onClick={onSubmit}
              style={{ background: "#2C2A24", color: "#F7F4ED" }}
              type="button"
            >
              Дүгнэлт харах →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
