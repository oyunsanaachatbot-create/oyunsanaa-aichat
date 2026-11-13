export type CapacityGroup = "primary" | "secondary";

export type Capacity = {
  id: string;
  group: CapacityGroup;
  name: string;
  description: string;
};

export type ProgramResult = {
  id: string;
  at: number;
  pct: Record<"body" | "work" | "bond" | "meaning", number>;
  notes: Record<"body" | "work" | "bond" | "meaning", string>;
  answers: Record<string, string>;
  scores: Record<string, number>;
  finalNote: string;
};

export const CAPACITIES: Capacity[] = [
  {
    id: "love",
    group: "primary",
    name: "Хайр · Хүлээн зөвшөөрөл",
    description:
      "Өөрийгөө болон бусдыг байгаагаар нь хүлээн зөвшөөрч, халамжлах",
  },
  {
    id: "model",
    group: "primary",
    name: "Үлгэр жишээ авах",
    description: "Бусдын зан үйл, амьдралаас суралцах, үлгэр авах",
  },
  {
    id: "patience",
    group: "primary",
    name: "Тэвчээр",
    description: "Хүлээцтэй байж, таагүй байдлыг тэсвэрлэх",
  },
  {
    id: "time",
    group: "primary",
    name: "Цаг гаргах",
    description: "Өөртөө болон бусдад цаг гаргаж, цагийн үнэ цэнийг мэдрэх",
  },
  {
    id: "intimacy",
    group: "primary",
    name: "Дотносол · Бэлгийн амьдрал",
    description: "Бие махбод, сэтгэл хөдлөлийн дотнослыг мэдрэх",
  },
  {
    id: "contact",
    group: "primary",
    name: "Харилцаа холбоо",
    description: "Бусадтай дотно, дулаан харилцаа тогтоох",
  },
  {
    id: "faith",
    group: "primary",
    name: "Итгэл",
    description: "Өөртөө, бусдад, амьдралд итгэх суурь итгэл",
  },
  {
    id: "hope",
    group: "primary",
    name: "Найдвар",
    description: "Ирээдүйг өөдрөгөөр харж, боломжийг мэдрэх",
  },
  {
    id: "care",
    group: "primary",
    name: "Тэжээл · Халамж хайх",
    description: "Тусламж, дэмжлэг, хайрыг хүсэж, хүлээн авах",
  },
  {
    id: "trust",
    group: "primary",
    name: "Итгэлцэл · Нөхөрлөл",
    description: "Ижил тэгш, итгэлцсэн харилцаа үүсгэх",
  },
  {
    id: "doubt",
    group: "primary",
    name: "Эргэлзээ",
    description: "Шүүмжлэлтэй хандаж, эргэцүүлэн бодох",
  },
  {
    id: "unity",
    group: "primary",
    name: "Нэгдмэл байдал · Бишрэл",
    description: "Амьдралын утга учир, оюун санааны ертөнцтэй холбогдох",
  },
  {
    id: "punctuality",
    group: "secondary",
    name: "Цаг баримтлах",
    description: "Амласан цагтаа байж, хуваарь мөрдөх",
  },
  {
    id: "cleanliness",
    group: "secondary",
    name: "Цэвэрч байдал",
    description: "Бие болон орчноо цэвэр цэгцтэй байлгах",
  },
  {
    id: "order",
    group: "secondary",
    name: "Цэгцтэй байдал",
    description: "Ажил, эд зүйлээ системтэй байлгах",
  },
  {
    id: "honesty",
    group: "secondary",
    name: "Шударга зан",
    description: "Үнэнийг шууд, ил тод хэлэх",
  },
  {
    id: "precision",
    group: "secondary",
    name: "Нарийвчлал",
    description: "Ажлыг алдаагүй, гүйцэд хийх",
  },
  {
    id: "politeness",
    group: "secondary",
    name: "Эелдэг · Хүндэтгэл",
    description: "Бусдыг хүндэтгэж, соёлтой харилцах",
  },
  {
    id: "obedience",
    group: "secondary",
    name: "Дуулгавартай байдал",
    description: "Дүрэм журам, зааврыг дагах",
  },
  {
    id: "justice",
    group: "secondary",
    name: "Шударга ёс",
    description: "Тэгш, зөв хуваарилж, шийдэх",
  },
  {
    id: "diligence",
    group: "secondary",
    name: "Хичээнгүй · Хөдөлмөрч",
    description: "Зорилгынхоо төлөө хичээнгүй ажиллах",
  },
  {
    id: "thrift",
    group: "secondary",
    name: "Хэмнэлттэй байдал",
    description: "Мөнгө, цаг, энергиэ гамтай зарцуулах",
  },
  {
    id: "reliability",
    group: "secondary",
    name: "Найдвартай байдал",
    description: "Хэлсэндээ хүрч, хариуцлага хүлээх",
  },
  {
    id: "secrecy",
    group: "secondary",
    name: "Нууц хадгалах",
    description: "Итгэж хэлсэн зүйлийг өөртөө үлдээх",
  },
];

export const DAILY_REFLECTIONS = [
  "Өнөөдөр би бие махбод, эрүүл мэнддээ чиглэсэн юу хийсэн бэ? Түүндээ хэр сэтгэл хангалуун байсан бэ?",
  "Өнөөдөр би ажил, сургууль, гэр бүлийн орчинд ямар ажил үүргийг гүйцэтгэсэн бэ? Хэр бүтээмжтэй байсан бэ? Энэ талаар эргэцүүлэхэд надад ямар мэдрэмж төрсөн бэ?",
  "Өнөөдөр би хэнтэй чин сэтгэлээсээ, шүүмжлэлгүйгээр нээлттэй, тухтай ярилцсан бэ? Ийм ярилцлагын дараа надад ямар санагдсан бэ?",
  "Өнөөдөр би юунаас утга учир, үнэ цэн мэдэрсэн бэ? Энэ нь надад хэр таатай эсвэл таагүй санагдсан бэ?",
];

export const HIGH_REFLECTIONS = [
  "Би яагаад энэ талбарт өндөр оноо өгсөн бэ?",
  "Энэ талбар миний амьдралд ямар үүрэгтэй вэ?",
  "Би өөрийгөө энэ талбараар хэмжих нь түгээмэл байдаг уу?",
  "Энэ талбар надад юу өгдөг вэ? Намайг юунаас хамгаалдаг вэ?",
  "Би энэ талбартаа хэр их цаг, эрч хүчээ зарцуулсан бэ? Үүнээс болж өөр юу юуг орхигдуулсан бэ?",
];

export const LOW_REFLECTIONS = [
  "Би яагаад үүнийг орхисон бэ?",
  "Энэ талбарт анхаарахгүй байх нь надад ямар сэтгэл, мэдрэмж төрүүлдэг вэ?",
  "Энэ талбарт анхаарахгүй байснаар надад ямар ашигтай байсан бэ?",
  "Би юунаас зугтааж энэ талбарыг анхааралгүй орхигдуулдаг вэ?",
];

export const CAPACITY_REFLECTIONS = [
  "Би яагаад үүнийг бага ашигладаг юм бол?",
  "Энэ төрлийн чадвартай хүмүүсийг би хэрхэн харж, үнэлдэг вэ?",
  "Энэ чадварыг сураад, ашиглавал юу болох бол? Юу өөрчлөгдөх бол?",
  "Энэ чадвартай холбоотой би юунаас айж, юунаас зугтаадаг вэ?",
  "Энэ чадвар надад ямар нөөц боломжийг авч ирж болох вэ?",
];
