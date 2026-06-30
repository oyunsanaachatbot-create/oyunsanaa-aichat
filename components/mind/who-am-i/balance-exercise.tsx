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
    if (!isOk) return;
    saveRun({ at: Date.now(), pct, notes, change: "" });
    router.push("/mind/who-am-i/conclusion");
  };

  return (
    <div className="wai-balance mx-auto w-full max-w-[600px] text-foreground">
      <style>{`
        .wai-balance input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:30px;width:100%}
        .wai-balance input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:99px;background:var(--border)}
        .wai-balance input[type=range]::-moz-range-track{height:6px;border-radius:99px;background:var(--border)}
        .wai-balance input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:var(--background);border:2px solid currentColor;margin-top:-8px;box-shadow:0 2px 6px rgba(0,0,0,.15)}
        .wai-balance input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--background);border:2px solid currentColor;box-shadow:0 2px 6px rgba(0,0,0,.15)}
      `}</style>

      {screen === "intro" && (
        <section>
          <p className="m-0 mb-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[.22em]">
            Балансын загвар · Н. Пезешкиан
          </p>
          <h1 className="m-0 mb-4 font-bold text-3xl leading-tight tracking-tight sm:text-4xl">
            Алдаж болохгүй амьдралын{" "}
            <em className="not-italic" style={{ color: "#6E6CA3" }}>
              тэнцвэр
            </em>
          </h1>
          <p className="m-0 mb-2 text-base text-foreground/80">
            Эерэг ба соёл хоорондын сэтгэл засал нь амьдралын энергийг дөрвөн
            талбарт хуваан үздэг. Энэ нам гүм дасгал танд аль талбартаа илүү
            автаж, алийг нь орхигдуулж байгаагаа олж харахад тусална.
          </p>
          <p className="m-0 mb-2 text-base text-muted-foreground">
            Яаралгүй, өөртөө үнэнчээр хариулаарай.
          </p>

          <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELD_DOTS.map((f) => (
              <div
                className="flex items-center gap-3 rounded-2xl border bg-muted p-4"
                key={f.key}
              >
                <span
                  className="size-[10px] shrink-0 rounded-full"
                  style={{ background: f.hex }}
                />
                <div>
                  <b className="block font-semibold text-sm">{f.title}</b>
                  <span className="text-muted-foreground text-xs">
                    {f.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="hover:-translate-y-0.5 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-transform"
              onClick={() => setScreen("area")}
              type="button"
            >
              Эхлэх →
            </button>
            <span className="ml-1.5 text-muted-foreground text-xs">
              ~5 минут
            </span>
          </div>

          <p className="mt-6 text-muted-foreground text-xs">
            Таны хариулт зөвхөн энэ дэлгэц дээр, таны мэдэлд үлдэнэ — хаашаа ч
            хадгалагдаж, илгээгдэхгүй.
          </p>
        </section>
      )}

      {screen === "area" && (
        <section>
          <div className="mb-6 flex gap-2">
            {BALANCE_AREAS.map((a, i) => (
              <div
                className="h-[5px] flex-1 overflow-hidden rounded-full bg-border"
                key={a.key}
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
              className="grid size-[48px] shrink-0 place-items-center rounded-xl text-white"
              style={{ background: area.hex }}
            >
              <span className="font-semibold text-base">{areaIdx + 1}</span>
            </div>
            <div>
              <div className="font-medium text-muted-foreground text-xs">
                {area.tag}
              </div>
              <div className="font-semibold text-2xl leading-tight">
                {area.title}
              </div>
            </div>
          </div>
          <p className="mt-1 mb-5 text-foreground/70 text-sm">{area.desc}</p>

          <div>
            {area.questions.map((q, i) => (
              <div className="flex gap-3.5 border-t py-4" key={q}>
                <span className="w-5 shrink-0 text-base text-muted-foreground italic">
                  {i + 1}
                </span>
                <p className="m-0 text-sm leading-relaxed">{q}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label
              className="mb-2 block font-medium text-muted-foreground text-xs"
              htmlFor="area-note"
            >
              Энэ талбар дээр бодогдсон зүйлээ тэмдэглэе (заавал биш)
            </label>
            <textarea
              className="w-full resize-y rounded-xl border bg-muted p-3.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
              id="area-note"
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [area.key]: e.target.value }))
              }
              placeholder="Чөлөөтэй бичээрэй…"
              style={{ minHeight: 88 }}
              value={notes[area.key]}
            />
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              className="rounded-full px-4 py-3 font-medium text-muted-foreground text-sm"
              onClick={onPrevArea}
              style={{ visibility: areaIdx === 0 ? "hidden" : "visible" }}
              type="button"
            >
              ← Буцах
            </button>
            <button
              className="hover:-translate-y-0.5 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-transform"
              onClick={onNextArea}
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
          <p className="m-0 mb-3.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[.22em]">
            Балансын тест
          </p>
          <h1 className="m-0 mb-4 font-bold text-2xl sm:text-3xl">
            Энергиэ хуваарилаарай
          </h1>
          <p className="m-0 mb-2 text-muted-foreground text-sm">
            Одоогийн байдлаар цаг, энергиэ эдгээр дөрвөн талбарт хэдэн хувиар
            зарцуулж байгаагаа гулсуураар тааруулна уу. Нийлбэр нь <b>100%</b>{" "}
            болох ёстой.
          </p>

          <div className="mx-auto mt-4 mb-1.5 rounded-2xl border bg-muted p-4 text-center">
            <div className="mx-auto mb-1 inline-flex gap-1 rounded-full border bg-accent p-1">
              {(["kite", "platform", "auras"] as BalanceVizMode[]).map((m) => (
                <button
                  className="rounded-full px-3.5 py-1.5 font-semibold text-xs transition-colors"
                  key={m}
                  onClick={() => setVizMode(m)}
                  style={
                    vizMode === m
                      ? {
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                        }
                      : { color: "var(--muted-foreground)" }
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
            <div className="mt-0.5 text-muted-foreground text-xs">
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
                <div className="flex items-center gap-2.5 font-medium text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: a.hex }}
                  />
                  <span className="text-foreground">{a.title}</span>
                </div>
                <div
                  className="min-w-[50px] text-right font-semibold text-xl"
                  style={{ color: "var(--foreground)" }}
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
            className="mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
            style={
              isOk
                ? { background: "#F0F4EA", borderColor: "#9DB58D" }
                : undefined
            }
          >
            <span className="text-foreground">
              Нийлбэр: <b className="text-lg">{sum}</b>%{" "}
              <span className="text-muted-foreground">
                {isOk
                  ? "· бэлэн"
                  : sum < 100
                    ? `· ${100 - sum}% дутуу`
                    : `· ${sum - 100}% илүү`}
              </span>
            </span>
            <button
              className="rounded-full px-3 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
              onClick={() => setPct({ ...EVEN })}
              type="button"
            >
              25% тус бүр
            </button>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              className="rounded-full px-4 py-3 font-medium text-muted-foreground text-sm"
              onClick={() => setScreen("area")}
              type="button"
            >
              ← Буцах
            </button>
            <button
              className="hover:-translate-y-0.5 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-transform disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isOk}
              onClick={onSubmit}
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
