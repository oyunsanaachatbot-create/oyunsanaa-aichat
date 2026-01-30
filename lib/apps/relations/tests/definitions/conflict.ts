import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Бараг үгүй" },
  { value: 2, label: "Хааяа" },
  { value: 3, label: "Ихэвчлэн" },
  { value: 4, label: "Байнга / Тийм" },
];

export const conflict: TestDefinition = {
  id: "conflict",
  slug: "conflict",
  title: "Маргаан шийдэх ур чадвар тест",
  subtitle: "10 асуулт · харилцаа",
  description: "Маргаанд тайван, шийдэлд чиглэсэн байдлаар харилцах чадварыг шалгана.",
  questions: [
    { id: "q1", text: "Маргаан эхлэхэд “чи дандаа…” гэхийн оронд тодорхой үйлдлийг ярьдаг.", options: OPTIONS },
    { id: "q2", text: "Дуугаа өндөрсгөхгүй байхыг хичээдэг.", options: OPTIONS },
    { id: "q3", text: "Ялалт биш шийдэл хайдаг.", options: OPTIONS },
    { id: "q4", text: "Баримт ба мэдрэмжээ ялгаж хэлж чаддаг.", options: OPTIONS },
    { id: "q5", text: "Нөгөө хүний талын үнэнийг хүлээн зөвшөөрч чаддаг.", options: OPTIONS },
    { id: "q6", text: "Түр завсарлага авч тайвширч чаддаг.", options: OPTIONS },
    { id: "q7", text: "“Би ингэж мэдэрсэн” гэж буруутгалгүй илэрхийлдэг.", options: OPTIONS },
    { id: "q8", text: "Тохиролцоо хийж, дараа нь мөрддөг.", options: OPTIONS },
    { id: "q9", text: "Өнгөрснийг сөхөхгүйгээр одоог шийдэхийг хичээдэг.", options: OPTIONS },
    { id: "q10", text: "Маргааны дараа харилцаагаа сэргээх алхам хийдэг.", options: OPTIONS },
  ],
  bands: [
    { minPct: 0.78, title: "Шийдэлч", summary: "Маргааныг тайван зохицуулах чадвар өндөр.", tips: ["Маргааны үед 10–20 секунд завсарлага авч амьсгал."] },
    { minPct: 0.55, title: "Дунд", summary: "Ихэнхдээ боломжийн ч заримдаа эмоц давамгайлж магадгүй.", tips: ["“Би … гэж мэдэрсэн” өгүүлбэрээр эхэлж сур."] },
    { minPct: 0, title: "Сайжруулах", summary: "Маргаан шийдэх чадвар сул байж магадгүй.", tips: ["“Ялалт” биш “шийдэл” гэсэн зорилгыг сана."] },
  ],
};
