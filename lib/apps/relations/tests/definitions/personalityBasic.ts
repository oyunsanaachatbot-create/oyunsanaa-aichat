import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Огт үгүй" },
  { value: 2, label: "Ховор" },
  { value: 3, label: "Заримдаа" },
  { value: 4, label: "Ихэнхдээ" },
  { value: 5, label: "Бараг үргэлж" },
];

export const personalityBasic: TestDefinition = {
  slug: "personality-basic",
  title: "Зан чанар тодорхойлох тест",
  meta: "12 асуулт · 2–3 минут",
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

  computeResult: (answers) => {
    const vals = Object.values(answers);
    const total = vals.reduce((s, v) => s + v, 0);
    const max = 12 * 5;

    // маш энгийн, ойлгомжтой band
    const pct = total / max;

    if (pct >= 0.78) {
      return {
        key: "stable-confident",
        title: "Тайван · Өөртөө итгэлтэй хэв маяг",
        summaryShort: "Та өөрийгөө сайн барьж, байр сууриа тайван илэрхийлэх хандлагатай байна.",
        whatToTry: "Өнөөдөр 1 удаа: “Би ингэж бодож байна” гэж зөөлөн эхлүүлээд байр сууриа хэлээд үзээрэй.",
      };
    }

    if (pct >= 0.58) {
      return {
        key: "balanced",
        title: "Тэнцвэртэй хэв маяг",
        summaryShort: "Ихэнх нөхцөлд тайван, гэхдээ зарим үед өөрийгөө хамгаалах нь хэцүү байж магадгүй.",
        whatToTry: "Маргаанд орвол 1 удаа: 3 амьсгаа аваад дараа нь хариулаарай.",
      };
    }

    if (pct >= 0.40) {
      return {
        key: "sensitive",
        title: "Мэдрэмтгий · Эвийг эрхэмлэдэг хэв маяг",
        summaryShort: "Бусдын мэдрэмжийг анзаардаг ч өөрийгөө хойш тавих хандлага илэрч байна.",
        whatToTry: "Өнөөдөр нэг жижиг “үгүй” хэлж сур: “Одоохондоо амжихгүй байна” гэж хэлээд үз.",
      };
    }

    return {
      key: "overloaded",
      title: "Ядарсан · Дотроо их ачаалдаг хэв маяг",
      summaryShort: "Стресс, дарамтад өөрийгөө ихээр буруутгах/ачаа үүрэх хандлага байж магадгүй.",
      whatToTry: "Өнөөдөр: 10 минут алхах эсвэл 5 минут чимээгүй суу. Дараа нь 1 өгүүлбэр бич: “Одоо надад хамгийн хэрэгтэй зүйл бол …”",
    };
  },
};
