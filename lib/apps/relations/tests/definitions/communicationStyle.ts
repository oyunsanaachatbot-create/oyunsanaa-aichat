import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Огт үгүй" },
  { value: 2, label: "Ховор" },
  { value: 3, label: "Заримдаа" },
  { value: 4, label: "Ихэнхдээ" },
  { value: 5, label: "Бараг үргэлж" },
];

export const communicationStyle: TestDefinition = {
  slug: "communication-style",
  title: "Харилцах хэв маяг тест",
  meta: "12 асуулт · богино",
  questions: [
    { id: "q1", text: "Маргаанд би түрүүлж тайлбарлаж, өөрийгөө хамгаалдаг.", options: OPTIONS },
    { id: "q2", text: "Би нөгөө хүнийг таслалгүй сонсож чаддаг.", options: OPTIONS },
    { id: "q3", text: "Би дуугаа өндөрсгөхөөс өмнө түр завсарлаж чаддаг.", options: OPTIONS },
    { id: "q4", text: "Би буруутгах биш мэдрэмжээрээ ярьдаг.", options: OPTIONS },
    // дараа нь чи нэмээд баяжуулна
  ],

  computeResult: (answers) => {
    const total = Object.values(answers).reduce((s, v) => s + v, 0);
    return {
      key: "temp",
      title: "Түр дүгнэлт",
      summaryShort: `Одоогоор ${total} оноо (түр). Дараа нь асуултуудыг бүрэн болгоод бодит дүгнэлт гаргана.`,
      whatToTry: "1 жижиг алхам: Нөгөө хүний үгийг давтаж баталгаажуул (“Тэгэхээр чи … гэж бодож байна, тийм үү?”).",
    };
  },
};
