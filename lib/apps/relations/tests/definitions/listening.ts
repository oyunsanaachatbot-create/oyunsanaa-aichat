import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Бараг үгүй" },
  { value: 2, label: "Хааяа" },
  { value: 3, label: "Ихэвчлэн" },
  { value: 4, label: "Байнга / Тийм" },
];

export const listening: TestDefinition = {
  id: "listening",
  slug: "listening",
  title: "Сонсох чадвар тест",
  subtitle: "10 асуулт · харилцаа",
  description: "Ярилцлагадаа сонсох байр сууриа хэр барьдаг вэ гэдгийг шалгана.",
  questions: [
    { id: "q1", text: "Яриаг нь таслалгүйгээр дуусгах боломж өгдөг.", options: OPTIONS },
    { id: "q2", text: "Сонсож байхдаа зөвлөгөө өгөхөөсөө өмнө юу мэдэрч байгааг нь асуудаг.", options: OPTIONS },
    { id: "q3", text: "“Чи тэгээд … гэж ойлголоо зөв үү?” гэж баталгаажуулж чаддаг.", options: OPTIONS },
    { id: "q4", text: "Утас/анхаарал сарниулагчгүйгээр бүрэн анхаарч чаддаг.", options: OPTIONS },
    { id: "q5", text: "Өөрийнхөөрөө дүгнэхээс илүүтэй эхлээд ойлгохыг хичээдэг.", options: OPTIONS },
    { id: "q6", text: "Маргаан үед ч сонсох байр сууриа барьж чаддаг.", options: OPTIONS },
    { id: "q7", text: "Нөгөө хүний үгийг өөрөөр нь давтаж ойлгуулж өгдөг.", options: OPTIONS },
    { id: "q8", text: "Ярианы сүүлд “Чамд одоо надаас юу хэрэгтэй вэ?” гэж асуудаг.", options: OPTIONS },
    { id: "q9", text: "Шүүмжилж хэлсэн үед хамгаалах биш сонсож чаддаг.", options: OPTIONS },
    { id: "q10", text: "Хүмүүс “Чи сайн сонсдог” гэж хэлдэг.", options: OPTIONS },
  ],
  bands: [
    { minPct: 0.78, title: "Сайн", summary: "Сонсох ур чадвар өндөр байна.", tips: ["Ярианы төгсгөлд нэг өгүүлбэрээр дүгнэж баталгаажуул."] },
    { minPct: 0.55, title: "Дунд", summary: "Ерөнхийдөө сайн ч зарим үед сарнидаг байж магадгүй.", tips: ["Сонсох үедээ утсаа хол тавьж 5 минут бүрэн анхаар."] },
    { minPct: 0, title: "Сайжруулах", summary: "Сонсох дадал сул байна. Сайжруулах боломжтой.", tips: ["“Ойлголоо” гэж хэлэхээсээ өмнө 1 асуулт асууж хэвш."] },
  ],
};
