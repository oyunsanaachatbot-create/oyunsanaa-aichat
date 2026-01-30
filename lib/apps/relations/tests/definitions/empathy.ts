import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Бараг үгүй" },
  { value: 2, label: "Хааяа" },
  { value: 3, label: "Ихэвчлэн" },
  { value: 4, label: "Байнга / Тийм" },
];

export const empathy: TestDefinition = {
  id: "empathy",
  slug: "empathy",
  title: "Өрөвдөх сэтгэл / Энэрэл тест",
  subtitle: "10 асуулт · харилцаа",
  description: "Бусдын мэдрэмжийг хүлээн зөвшөөрөх, ойлгох чадварыг шалгана.",
  questions: [
    { id: "q1", text: "Нөгөө хүний мэдрэмжийг “зөв/буруу” гэж шүүхээсээ өмнө хүлээн зөвшөөрдөг.", options: OPTIONS },
    { id: "q2", text: "“Чамд хэцүү байна” гэж хэлж дэмжиж чаддаг.", options: OPTIONS },
    { id: "q3", text: "Хэн нэгний оронд өөрийгөө тавьж бодох дадалтай.", options: OPTIONS },
    { id: "q4", text: "Хүмүүсийн сул талыг хармагцаа шүүмжлэх биш ойлгохыг оролддог.", options: OPTIONS },
    { id: "q5", text: "Стресс үед ч хүн рүү дайрахгүй байхыг хичээдэг.", options: OPTIONS },
    { id: "q6", text: "Нэг хүний баяр/гунигийг хамт мэдэрч чаддаг.", options: OPTIONS },
    { id: "q7", text: "Уучлалт гуйх шаардлагатай үед бардамналаа давж чаддаг.", options: OPTIONS },
    { id: "q8", text: "“Би чамайг ойлгож байна” гэж бодитоор мэдрүүлж чаддаг.", options: OPTIONS },
    { id: "q9", text: "Өөр хүнээс ялгаатай үзэл бодлыг тайван сонсож чаддаг.", options: OPTIONS },
    { id: "q10", text: "Хэн нэгний алдааг “хүн юм чинь” гэж уужуу хардаг.", options: OPTIONS },
  ],
  bands: [
    { minPct: 0.78, title: "Энэрэнгүй", summary: "Өрөвдөх, ойлгох чадвар өндөр.", tips: ["Мэдрэмжийг нь нэрлээд өг: “Чи урам хугарсан юм шиг…”"] },
    { minPct: 0.55, title: "Дунд", summary: "Ерөнхийдөө ойлгодог ч зарим үед шүүх хандлага гарч магадгүй.", tips: ["Хариу хэлэхээс өмнө 1 удаа “тэгэхэд чи юу мэдэрсэн бэ?” гэж асуу."] },
    { minPct: 0, title: "Сайжруулах", summary: "Энэрэл/ойлголт сул талдаа байна.", tips: ["Шүүхийн оронд эхлээд баталгаажуул: “Чамд хэцүү байна.”"] },
  ],
};
