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
    desc: "Та бие махбод, мэдрэхүй, эрүүл мэнддээ хэрхэн анхаардаг тухай.",
    questions: [
      "Ойрын үед таны нойр, хооллолт, дасгал хөдөлгөөний идэвх ямар түвшинд байна вэ? Бие тань ямар нэг дохио (өвдөлт, ядаргаа) өгч байна уу?",
      "Стресстэй, хэцүү үед та биеэ хэрхэн торддог вэ — сайн амардаг уу, эсвэл дэглэм алдагдаж, биеэ гаргуунд нь гаргадаг уу?",
      "Гадаад төрх, бие махбоддоо хэр сэтгэл хангалуун байна вэ? Өөрийгөө халамжлахад өдөрт хэдэн минут зориулдаг вэ?",
    ],
  },
  {
    key: "work",
    hex: "#C28A3C",
    tag: "2-р талбар",
    title: "Ажил · Амжилт",
    desc: "Танин мэдэхүй, карьер, сурлага, санхүү болон амжилтын төлөөх тэмүүлэл.",
    questions: [
      "Өдөрт хэдэн цагийг ажил, сурлага, гэрийн заавал хийх үүрэгт зарцуулдаг вэ? Үүнээсээ яг ямар мэдрэмж авдаг вэ?",
      "Өөрийгөө үнэлэх үнэлэмж тань зөвхөн «амжилт гаргах», «бусдаас илүү байх» дээр тогтдог уу? Ажилгүй үед өөрийгөө хэрэггүй мэт мэдрэх үү?",
      "Сурч мэдэх, тархиа цэнэглэх явцдаа хэр сэтгэл хангалуун байна вэ? Оюуны чадамжаа бүрэн ашиглаж чадаж байна уу?",
    ],
  },
  {
    key: "bond",
    hex: "#C36C71",
    tag: "3-р талбар",
    title: "Харилцаа · Нийгэм",
    desc: "Гэр бүл, найз нөхөд, хамт олон, мөн өөрөө өөртэйгөө тогтоосон харилцаа.",
    questions: [
      "Сэтгэлээ нээж, шүүмжлэлгүйгээр ярилцаж чадах хүмүүс тань хэр олон вэ? Тэдэнд хангалттай цаг гаргаж чадаж байна уу?",
      "Харилцаа танд энерги нэмдэг үү, эсвэл туйлдуулж ядраадаг уу? Бусдын хэрэгцээг өөрийнхөөсөө дээгүүр тавиад байна уу?",
      "Өөртэйгөө хэр цаг өнгөрүүлдэг вэ? Ганцаараа байхдаа тухтай байж чаддаг уу, эсвэл ганцаардахаас айж харилцаа хайдаг уу?",
    ],
  },
  {
    key: "meaning",
    hex: "#6E6CA3",
    tag: "4-р талбар",
    title: "Ирээдүй · Утга учир",
    desc: "Итгэл үнэмшил, амьдралын зорилго, мөрөөдөл, зөн билэг, уран зөгнөл.",
    questions: [
      "Таны амьдарч буй гол зорилго, утга учир юу вэ? Ирээдүйгээ хэрхэн төсөөлж, юунд итгэж найддаг вэ?",
      "Танд зүгээр л мөрөөдөх, уран зөгнөх, урлагаар хичээллэх, юу ч бодохгүй амрах чөлөөт цаг гардаг уу?",
      "Төлөвлөгөө гаргахдаа дотоод дуу хоолой, зөн билгээ хэр сонсдог вэ? Одоо хийж буй зүйл ирээдүйн том зорилготой тань уялдаж байна уу?",
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
    const history = [run, ...readHistory()].slice(0, 60);
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
