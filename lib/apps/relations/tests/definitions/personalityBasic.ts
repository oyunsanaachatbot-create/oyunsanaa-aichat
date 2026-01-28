import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 0, label: "Огт үгүй" },
  { value: 1, label: "Ховор" },
  { value: 2, label: "Заримдаа" },
  { value: 3, label: "Ихэнхдээ" },
  { value: 4, label: "Бараг үргэлж" },
];

export const personalityBasic: TestDefinition = {
  id: "personality-basic",
  title: "Зан чанар тодорхойлох тест",
  subtitle: "12 асуулт · 2–3 минут",
  description: "Өөрийн зан төлөв, хандлагын ерөнхий чиг хандлагыг үнэлнэ.",
  questions: [
    { id: "q1", text: "Би шинэ орчинд ороход түр ажиглаад дараа нь ярьдаг.", options: OPTIONS },
    { id: "q2", text: "Би бусдын сэтгэл хөдлөлийг хурдан мэдэрдэг.", options: OPTIONS },
    { id: "q3", text: "Би маргаанаас зайлсхийх хандлагатай.", options: OPTIONS },
    { id: "q4", text: "Би өөрийн байр сууриа тайван хэлж чаддаг.", options: OPTIONS },
    { id: "q5", text: "Би өөртөө өндөр шаардлага тавьдаг.", options: OPTIONS },
    { id: "q6", text: "Шийдвэр гаргахдаа удаан бодож байж хийдэг.", options: OPTIONS },
    { id: "q7", text: "Надад шүүмжлэл хүнд тусдаг үе байдаг.", options: OPTIONS },
    { id: "q8", text: "Би бусдад таалагдах гэж өөрийгөө хойш тавьдаг үе байдаг.", options: OPTIONS },
    { id: "q9", text: "Би нээлттэй, шууд харилцахыг илүүд үздэг.", options: OPTIONS },
    { id: "q10", text: "Би уурласан ч өөрийгөө барьж чаддаг.", options: OPTIONS },
    { id: "q11", text: "Би жижиг зүйлээс ч санаа зовдог үе байдаг.", options: OPTIONS },
    { id: "q12", text: "Би өөрийн хил хязгаарыг тогтоож чаддаг.", options: OPTIONS },
  ],
  bands: [
    {
      minPct: 0,
      title: "Түр үнэлгээ",
      summary: "Тестийн дүнг одоогоор үндсэн дүрмээр харуулж байна.",
      tips: [
        "Хариултаа эргэцүүлж, өдөр тутмын харилцаандаа нэг жижиг алхам туршаарай.",
      ],
    },
  ],
};
