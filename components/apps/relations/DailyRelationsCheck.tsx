"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTodayKey,
  loadAllEntries,
  upsertEntry,
  type RelationsDailyEntry,
} from "@/lib/apps/relations/dailyCheckStorage";

function generateCoachSummary(entry: RelationsDailyEntry) {
  const situation = entry.situation?.trim() || "";
  const response = entry.response?.trim() || "";
  const nextTime = entry.nextTime?.trim() || "";

  // Маш энгийн heuristic “дүгнэлт” (AI хэрэглэлгүйгээр)
  const text = `${situation} ${response} ${nextTime}`.toLowerCase();

  const hasAnger = /(уур|уцаар|хашгир|загна)/.test(text);
  const hasAvoid = /(дуугүй|тоосор|зайлсхий|хариу(ла|л)хгүй|алга бол)/.test(text);
  const hasBlame = /(чи.*(үргэлж|дандаа)|буруу|чи л)/.test(text);
  const hasIMessage = /(би.*мэдэр)/.test(text);
  const hasAsk = /(асуу|яагаад|юу болсон)/.test(text);
  const hasBoundary = /(хил|болохгүй|ингэхгүй|дараа нь|хязгаар)/.test(text);

  let title = "Өнөөдрийн дүгнэлт";
  let insight =
    "Чи өнөөдрийн харилцаагаа ажиглаж бичсэн нь өөрөө том алхам шүү.";
  let oneStep =
    "Маргааш нэг удаа: “Би ингэж мэдэрсэн” гэдгээр 1 өгүүлбэр хэлээд үзээрэй.";

  if (hasAnger) {
    title = "Уурын үед өөрийгөө хамгаалах";
    insight =
      "Уур ихсэхэд үг хурцрах нь амархан. Хамгийн түрүүнд түр завсарлага авах нь харилцааг авардаг.";
    oneStep = "Дараа нь 10 секунд амьсгалаад, ‘Би түр завсарлая’ гэж хэлээд үз.";
  } else if (hasAvoid) {
    title = "Зайлсхийх хэв маяг ажиглагдлаа";
    insight =
      "Дуугүй болох/алга болох нь түр амар боловч ойлголцлыг удаашруулдаг.";
    oneStep =
      "Маргааш богинохон: ‘Би одоо бэлэн биш, гэхдээ ___ цагт ярья’ гэж хэл.";
  } else if (hasBlame) {
    title = "Буруутгал ихэссэн бол";
    insight =
      "‘Чи дандаа…’ гэдэг үг нөгөө хүнийг хамгаалалттай болгож, асуудал шийдэгдэхгүй үлдэх нь элбэг.";
    oneStep =
      "Маргааш ‘Чи…’-г ‘Би… мэдэрсэн’ болгож 1 өгүүлбэрээр сольж хэлээд үз.";
  } else if (hasIMessage) {
    title = "Өөрийгөө илэрхийлэлт сайн байна";
    insight =
      "‘Би ингэж мэдэрсэн…’ гэж хэлж чаддаг байх нь эрүүл харилцааны суурь.";
    oneStep =
      hasAsk
        ? "Маргааш яг энэ хэв маягаа үргэлжлүүлээд, 1 нээлттэй асуулт нэм."
        : "Маргааш 1 нээлттэй асуулт (Ямар санагдсан бэ?) нэмээд үз.";
  } else if (hasBoundary) {
    title = "Хил хязгаарын дохио байна";
    insight =
      "Хилээ нэрлэж чаддаг байх нь харилцааг тогтвортой болгодог.";
    oneStep =
      "Маргааш ‘Надад ___ хэрэгтэй’ гэж 1 өгүүлбэрээр эелдгээр хэлээд үз.";
  }

  // Товч тэмдэглэлээс нэг “сайн зүйл” гаргах
  const good =
    nextTime
      ? `Сайн байна — чи “дараагийн удаа” гэдгээ тодорхойлжээ: ${nextTime}`
      : "Сайн байна — дараагийн удаа хийх 1 жижиг алхмаа тодорхойлоод бичвэл бүр хүчтэй болно.";

  return { title, insight, oneStep, good };
}

export default function DailyRelationsCheck() {
  const [todayKey, setTodayKey] = useState("");
  const [entries, setEntries] = useState<RelationsDailyEntry[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // 3 асуулт
  const [person, setPerson] = useState("");
  const [situation, setSituation] = useState("");
  const [response, setResponse] = useState("");
  const [nextTime, setNextTime] = useState("");

  const [showCoach, setShowCoach] = useState(true);

  useEffect(() => {
    // client runtime дээр л тогтооно
    setTodayKey(getTodayKey());
  }, []);

  useEffect(() => {
    if (!todayKey) return;

    const all = loadAllEntries();
    setEntries(all);

    const today = all.find((e) => e.dateKey === todayKey);
    if (today) {
      setPerson(today.person ?? "");
      setSituation(today.situation ?? "");
      setResponse(today.response ?? "");
      setNextTime(today.nextTime ?? "");
      setSavedAt(today.updatedAt ?? null);
    }
  }, [todayKey]);

  const todayEntry: RelationsDailyEntry | null = useMemo(() => {
    if (!todayKey) return null;
    return {
      id: todayKey,
      dateKey: todayKey,
      person: person.trim(),
      situation: situation.trim(),
      response: response.trim(),
      nextTime: nextTime.trim(),
      updatedAt: new Date().toISOString(),
    };
  }, [todayKey, person, situation, response, nextTime]);

  const coach = useMemo(() => {
    if (!todayEntry) return null;
    return generateCoachSummary(todayEntry);
  }, [todayEntry]);

  const canSave = useMemo(() => {
    // Богино мөртлөө хэрэгтэй: дор хаяж 1–2 талбар бөглөгдвөл хадгалж болно
    const s = situation.trim();
    const r = response.trim();
    const n = nextTime.trim();
    return s.length > 0 || r.length > 0 || n.length > 0 || person.trim().length > 0;
  }, [person, situation, response, nextTime]);

  const last7 = useMemo(() => entries.slice(0, 7), [entries]);

  function save() {
    if (!todayEntry || !canSave) return;
    const next = upsertEntry(todayEntry);
    setEntries(next);
    setSavedAt(todayEntry.updatedAt ?? null);
    setShowCoach(true);
  }

  function loadEntry(e: RelationsDailyEntry) {
    setPerson(e.person ?? "");
    setSituation(e.situation ?? "");
    setResponse(e.response ?? "");
    setNextTime(e.nextTime ?? "");
    setSavedAt(e.updatedAt ?? null);
    setShowCoach(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!todayKey) {
    return <div className="p-4 text-sm opacity-70">Ачаалж байна…</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-semibold">
          Өнөөдөр би яаж харилцав?
        </h1>
        <div className="text-sm opacity-70">
          1 минут. 3 өгүүлбэр. Дараа нь Оюунсанаа дүгнэнэ.
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
          <div className="text-sm font-medium">Хэнтэй голчлон харилцсан бэ? (заавал биш)</div>
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Ж: Нөхөр, ээж, найз, ажлын хүн…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">1) Нөхцөл байдал (1 өгүүлбэр)</div>
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="Ж: Ажил дээр маргаан үүссэн…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">2) Би яаж хариулав? (1 өгүүлбэр)</div>
          <input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Ж: Би тайлбарлах гэж яараад нөгөө хүнийг тасалсан…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">3) Дараагийн удаа би юуг өөрөөр хийх вэ? (1 өгүүлбэр)</div>
          <input
            value={nextTime}
            onChange={(e) => setNextTime(e.target.value)}
            placeholder="Ж: 60 сек чимээгүй сонсоод дараа нь асуулт асууна…"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <button
            onClick={save}
            disabled={!canSave}
            className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
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

        {showCoach && coach && todayEntry && (
          <div className="rounded-2xl border p-4 space-y-2 text-sm">
            <div className="font-semibold">{coach.title}</div>
            <div className="opacity-80">{coach.insight}</div>
            <div className="opacity-80">
              <span className="font-medium">Өнөөдрийн 1 алхам:</span> {coach.oneStep}
            </div>
            <div className="opacity-70">{coach.good}</div>
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
                    {e.person ? `Хэнтэй: ${e.person}` : ""}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1 line-clamp-1">
                  {e.nextTime ? `Дараа нь: ${e.nextTime}` : (e.response ? `Хариу: ${e.response}` : (e.situation ? `Нөхцөл: ${e.situation}` : ""))}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
