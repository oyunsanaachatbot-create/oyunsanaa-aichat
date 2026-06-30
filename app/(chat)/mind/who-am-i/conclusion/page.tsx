"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AppCard,
  AppShell,
  Badge,
  Button,
  EmptyState,
  Muted,
  PageHero,
} from "@/components/mind/app-shell";
import { BalanceDiagram } from "@/components/mind/who-am-i/balance-diagram";
import {
  BALANCE_AREAS,
  type BalanceRun,
  clearHistory,
  deleteRun,
  readHistory,
  readLastRun,
} from "@/lib/mind/who-am-i-balance";

const BRAND = "#1F6FB2";

const NEXT_STEPS = [
  {
    title: "Оюунсанаатай чатлах",
    href: "/",
    note: "Зүгээр л бодол, сэтгэлээ бичиж хуваалцаарай. Заримдаа бид ярьж эхлэх үедээ л өөрийгөө илүү сайн ойлгодог.",
  },
  {
    title: "Миний ертөнц апп",
    href: "/mind/ebooks",
    note: "Өдөр бүрийн мэдрэмжээ тэмдэглэх нь өөрийн дотоод ертөнцийг ойлгож, сэтгэлээ цэгцлэхэд тусална.",
  },
  {
    title: "Миний эрүүл мэнд апп",
    href: "/mind/self-care/stress",
    note: "Идэж буй хоолныхоо зургийг чат руу оруулахад л Оюунсанаа хоолны мэдээллийг задалж, бүртгэл хийнэ.",
  },
  {
    title: "Миний санхүү апп",
    href: "/mind/life/finance-app",
    note: "Худалдан авалт хийсэн баримтаа чат руу оруулахад л Оюунсанаа таны өмнөөс ангилж, цэгцэлж өгнө.",
  },
  {
    title: "Харилцааны тестүүд",
    href: "/mind/relations/tests",
    note: "Өөрийн харилцааны хэв маяг, хэрэгцээ мэдрэмжээ ойлгож, бусадтай эрүүл харилцаатай байхад тусална.",
  },
  {
    title: "Миний зорилго апп",
    href: "/mind/purpose/goal-planner",
    note: "Мөрөөдөл, хүсэл тэмүүллээ бодит зорилго болгон төлөвлөж, алхам алхмаар хэрэгжүүлэхэд тусална.",
  },
];

function titleOf(key: string) {
  return BALANCE_AREAS.find((a) => a.key === key)?.title ?? key;
}
function hexOf(key: string) {
  return BALANCE_AREAS.find((a) => a.key === key)?.hex ?? BRAND;
}

export default function WhoAmIConclusionPage() {
  const [run, setRun] = useState<BalanceRun | null>(null);
  const [history, setHistory] = useState<BalanceRun[]>([]);

  useEffect(() => {
    setRun(readLastRun());
    setHistory(readHistory());
  }, []);

  if (!run) {
    return (
      <AppShell backHref="/mind/who-am-i/intro" title="Дүгнэлт" width="3xl">
        <AppCard>
          <EmptyState icon="📊">
            Та өмнө нь амьдралын тэнцвэрээ шалгаагүй байна.
          </EmptyState>
          <div className="mt-4 flex justify-center">
            <Button href="/mind/who-am-i/balance-test">
              Амьдралын тэнцвэр шалгах
            </Button>
          </div>
        </AppCard>
      </AppShell>
    );
  }

  const entries = Object.entries(run.pct) as [string, number][];
  const hi = entries.reduce((m, x) => (x[1] > m[1] ? x : m));
  const lo = entries.reduce((m, x) => (x[1] < m[1] ? x : m));

  const onDeleteOne = (at: number) => {
    deleteRun(at);
    setHistory(readHistory());
  };
  const onDeleteAll = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <AppShell
      backHref="/mind/who-am-i/balance-test"
      title="Дүгнэлт"
      width="3xl"
    >
      <div className="space-y-4">
        <AppCard>
          <PageHero
            description="Аль талбар давамгай байна? Аль талбар орхигдсон байна? Та юунд илүү анхаарах хэрэгтэй вэ?"
            eyebrow={<Badge>AI тайлбар</Badge>}
            icon="📊"
            title="Таны амьдралын тэнцвэр"
          />

          <div className="mx-auto mb-2 max-w-[280px]">
            <BalanceDiagram mode="kite" pct={run.pct} />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {entries.map(([key, value]) => (
              <span
                className="rounded-full px-3 py-1.5 font-semibold text-white text-xs"
                key={key}
                style={{ background: hexOf(key) }}
              >
                {titleOf(key).split(" · ")[0]} {value}%
              </span>
            ))}
          </div>
        </AppCard>

        <AppCard className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-slate-900 text-sm">
            Хамгийн өндөр · «хоргодох байр» уу, дарамт уу?
          </div>
          <p className="mt-2 text-slate-700 text-sm leading-relaxed">
            Та энергийнхээ хамгийн ихийг (
            <b style={{ color: hexOf(hi[0]) }}>{hi[1]}%</b>){" "}
            <b>«{titleOf(hi[0])}»</b> талбарт зарцуулж байна. Энэ нь танд
            жинхэнэ хүч өгдөг талбар уу, эсвэл бусдаасаа зугтаж нуугддаг
            «хоргодох байр» нь болоод байна уу? Энд автсанаар орхигдож буй юу
            байна вэ?
          </p>
        </AppCard>

        <AppCard className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="font-semibold text-slate-900 text-sm">
            Хамгийн бага · орхигдсон талбар
          </div>
          <p className="mt-2 text-slate-700 text-sm leading-relaxed">
            <b>«{titleOf(lo[0])}»</b> талбар хамгийн бага буюу{" "}
            <b style={{ color: hexOf(lo[0]) }}>{lo[1]}%</b>-тай — хамгийн их
            орхигдсон хэсэг чинь энэ. Тэнцвэр алдагдвал ихэвчлэн эндээс эхэлдэг.
            Энэ талбар бага зэрэг сэргэвэл өдөр тутамд юу өөрчлөгдөх бол?
          </p>
        </AppCard>

        <div
          className="rounded-2xl border border-slate-200 p-4"
          style={{ background: "rgba(31,111,178,0.06)" }}
        >
          <div className="font-semibold text-slate-900 text-sm">
            Та тэнцвэрээ хадгалах өдөр тутмын алхмууд
          </div>
          <p className="mt-2 text-slate-700 text-sm leading-relaxed">
            Сэтгэлийн амар тайван нь нэг удаагийн үр дүн биш, харин өдөр бүр
            өөртөө анхаарал тавих үйл явц юм. Амьдралынхаа 4 талбарын тэнцвэрийг
            хадгалахын тулд дараах хэрэгслүүдийг ашиглаарай.
          </p>
          <div className="mt-3 grid gap-2.5">
            {NEXT_STEPS.map((s) => (
              <div
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                key={s.href + s.title}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">
                    {s.title}
                  </div>
                  <div className="mt-1 text-slate-600 text-xs leading-relaxed">
                    {s.note}
                  </div>
                </div>
                <Link
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 text-xs hover:bg-slate-50"
                  href={s.href}
                >
                  Очих
                </Link>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" href="/mind/who-am-i/balance-test">
          ↺ Дахин шалгах
        </Button>

        <AppCard className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-slate-900 text-sm">
              Хадгалсан түүх
            </div>
            {history.length > 0 && (
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 text-xs hover:bg-slate-50"
                onClick={onDeleteAll}
                type="button"
              >
                <Trash2 className="size-4" />
                Бүгдийг устгах
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <Muted>Хадгалсан түүх алга байна.</Muted>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  key={h.at}
                >
                  <div className="min-w-0">
                    <div className="text-slate-500 text-xs">
                      {new Date(h.at).toLocaleString()}
                    </div>
                    <div className="mt-1 text-slate-700 text-xs">
                      {Object.entries(h.pct)
                        .map(([k, v]) => `${titleOf(k).split(" · ")[0]}:${v}%`)
                        .join(" • ")}
                    </div>
                  </div>
                  <button
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 text-xs hover:bg-slate-50"
                    onClick={() => onDeleteOne(h.at)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </AppCard>

        <p className="text-slate-500 text-xs leading-relaxed">
          Тэнцвэр гэдэг дөрвөн талбарт яг тэнцүү цаг гаргах биш — өөрийгөө
          сонсож, орхигдуулсан хэсэгтээ ахин эргэж очих тэр зөөлөн хөдөлгөөн юм.
        </p>
      </div>
    </AppShell>
  );
}
