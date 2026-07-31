// Дөрвөн талбарын (Пезешкиан) амьдралын тэнцвэрийн дасгал — оролт/хадгалалт.

export type BalanceAreaKey = "body" | "work" | "bond" | "meaning";

export type BalanceArea = {
  key: BalanceAreaKey;
  hex: string;
  tag: string;
  title: string;
  desc: string;
  questions: string[];
};

export const BALANCE_AREAS: BalanceArea[] = [
  {
    key: "body",
    hex: "#7E9B6E",
    tag: "1-р талбар",
    title: "Бие махбод · Эрүүл мэнд",
    desc: "Энэхүү талбар нь та өөрийн бие махбод, эрүүл мэнддээ хэрхэн анхаардаг тухай юм.",
    questions: [
      "Ойрын үед таны нойрны чанар, хооллолт, дасгал хөдөлгөөний идэвх ямар түвшинд байна вэ?",
      "Бие тань танд ямар нэгэн дохио (өвдөлт, ядаргаа г.м) өгч байна уу?",
      "Та өөрийн гадаад төрх, гоо сайхандаа хэр сэтгэл хангалуун байдаг вэ?",
    ],
  },
  {
    key: "work",
    hex: "#C28A3C",
    tag: "2-р талбар",
    title: "Ажил · Үүрэг",
    desc: "Энэхүү талбар нь таны карьер, сурлага, ажил, санхүү болон амжилтын төлөөх тэмүүлэл, түүнд хэр их анхаарал хандуулж байгааг илэрхийлнэ.",
    questions: [
      "Та өдөрт хэдэн цагийг ажил, сурлага, эсвэл гэр орны заавал хийх ёстой үүрэг хариуцлагыг биелүүлэхэд зарцуулдаг вэ?",
      "Таны амьдралын үнэ цэнэ, өөрийгөө үнэлэх үнэлэмжид “амжилт гаргах, бусдаас илүү сайн байх” зэрэг ойлголт хэр чухал байр суурь эзэлдэг вэ?",
      "Хэрэв та хийсэн ажилгүй, хичээл сургуульгүй байвал өөрийгөө амжилтгүй, хэрэггүй хүн мэт мэдэрдэг үү?",
      "Та өөрийнхөө ажиллаж хөдөлмөрлөж, сурч мэдэж байгаа үйл явцдаа хэр их сэтгэл хангалуун байдаг вэ?",
      "Та гэр бүлийн гишүүд, дотны хүмүүстэйгээ ихэнхдээ тэдний сурлага хичээл, ажил хөдөлмөр, мөнгө санхүү, үүрэг хариуцлагын талаар яриа өрнүүлдэг үү?",
    ],
  },
  {
    key: "bond",
    hex: "#C36C71",
    tag: "3-р талбар",
    title: "Харилцаа · Нийгэмшил",
    desc: "Энэ талбар нь таны гэр бүл, найз нөхөд, хамт олонтойгоо тогтоосон жинхэнэ чанартай харилцааг хэмждэг.",
    questions: [
      "Танд харилцан сэтгэлээ нээж, ямар нэг шүүмжлэлгүйгээр, зааж зааварлалгүйгээр чин сэтгэлээсээ ярилцаж чадах хүмүүс (гэр бүл, найз нөхөд) хэр олон байдаг вэ?",
      "Та тэдэндээ хангалттай цаг гаргаж чадаж байгаа юу?",
      "Бусадтай харилцах харилцаа танд эрч хүч, энерги бэлэглэдэг үү, эсвэл таныг туйлдуулж ядраадаг уу?",
      "Та бусдын хэрэгцээг өөрийнхөөсөө дээгүүр эсвэл доогуур тавиад байна уу?",
      "Та ганцаараа байхдаа тухтай байж чаддаг уу, эсвэл ганцаардахаас айхдаа харилцаанд ороод байна уу?",
    ],
  },
  {
    key: "meaning",
    hex: "#6E6CA3",
    tag: "4-р талбар",
    title: "Утга учир ба ирээдүй",
    desc: "Энэ талбар нь таны итгэл үнэмшил, амьдралын зорилго, мөрөөдөл, уран зөгнөл зэргийг багтаадаг.",
    questions: [
      "Таны амьдарч буйн гол зорилго, утга учир юу вэ?",
      "Та ирээдүйгээ хэрхэн төсөөлж, юунд итгэж (шашин шүтлэг, гүн ухаан, шинжлэх ухаан, байгаль дэлхий г.м) найддаг вэ?",
      "Танд зүгээр л мөрөөдөх, уран зөгнөх, урлаг урлалаар хичээллэх, эсвэл бүр юу ч бодохгүй, хийхгүй амрах чөлөөт цаг гардаг уу?",
      "Та амьдралдаа өөрийн дотоод дуу хоолой, зөн билгээ хэр анзаарч сонсдог вэ?",
      "Одоо хийж буй зүйлс тань амьдралын тань том зорилготой уялдаж байгаа юу?",
    ],
  },
];

export type BalancePercents = Record<BalanceAreaKey, number>;

export type BalanceRun = {
  at: number; // Date.now()
  pct: BalancePercents;
  notes: Record<BalanceAreaKey, string>;
  change: string;
};

const LAST_KEY = "whoAmI:balance4:last";
const HISTORY_KEY = "whoAmI:balance4:history";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readLastRun(): BalanceRun | null {
  if (typeof window === "undefined") {
    return null;
  }
  return safeParse<BalanceRun>(window.localStorage.getItem(LAST_KEY));
}

export function readHistory(): BalanceRun[] {
  if (typeof window === "undefined") {
    return [];
  }
  const parsed = safeParse<BalanceRun[]>(
    window.localStorage.getItem(HISTORY_KEY)
  );
  if (!parsed || !Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter((x) => x && typeof x.at === "number").slice(0, 60);
}

export function saveRun(run: BalanceRun) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LAST_KEY, JSON.stringify(run));
    const history = [
      run,
      ...readHistory().filter((saved) => saved.at !== run.at),
    ].slice(0, 60);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore (quota/blocked)
  }
}

export function deleteRun(at: number) {
  if (typeof window === "undefined") {
    return;
  }
  const next = readHistory().filter((x) => x.at !== at);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearHistory() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
