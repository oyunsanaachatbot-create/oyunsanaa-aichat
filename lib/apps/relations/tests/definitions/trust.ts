import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Бараг үгүй" },
  { value: 2, label: "Хааяа" },
  { value: 3, label: "Ихэвчлэн" },
  { value: 4, label: "Байнга / Тийм" },
];

export const trust: TestDefinition = {
  id: "trust",
  slug: "trust",
  title: "Итгэлцэл ба найдвартай байдал тест",
  subtitle: "10 асуулт · харилцаа",
  description: "Найдвартай, тууштай зан төлөв хэр байна гэдгийг шалгана.",
  questions: [
    { id: "q1", text: "Амласан зүйлээ биелүүлэхийг хичээдэг.", options: OPTIONS },
    { id: "q2", text: "Хоцрох/өөрчлөгдөх үедээ урьдчилж мэдэгддэг.", options: OPTIONS },
    { id: "q3", text: "Нууц хадгалж чаддаг.", options: OPTIONS },
    { id: "q4", text: "Хариуцлагаа бусдад тохдоггүй.", options: OPTIONS },
    { id: "q5", text: "Алдаа гаргавал бултахгүйгээр хүлээн зөвшөөрдөг.", options: OPTIONS },
    { id: "q6", text: "Үгээрээ бус үйлдлээрээ итгэл төрүүлдэг.", options: OPTIONS },
    { id: "q7", text: "Хүнд үед орхиод явчихдаггүй.", options: OPTIONS },
    { id: "q8", text: "“Болно” гэж хэлчихээд таг болчихдоггүй.", options: OPTIONS },
    { id: "q9", text: "Чухал зүйл дээр шударга байдаг.", options: OPTIONS },
    { id: "q10", text: "Итгэл эвдэрвэл сэргээхийн тулд тогтвортой алхам хийдэг.", options: OPTIONS },
  ],
  bands: [
    { minPct: 0.78, title: "Найдвартай", summary: "Итгэл төрүүлэх зан төлөв өндөр байна.", tips: ["Амлалт бүр дээр хугацаа/дараагийн алхмыг тодруулж хэл."] },
    { minPct: 0.55, title: "Дунд", summary: "Ерөнхийдөө боломжийн ч тууштай байдал хэлбэлзэж магадгүй.", tips: ["Хоцрох бол 1 мессежээр заавал мэдэгддэг дадалтай бол."] },
    { minPct: 0, title: "Сайжруулах", summary: "Итгэлцэл дээр сайжруулах зүйл байна.", tips: ["Жижиг амлалт → биелүүлэх → давтах."] },
  ],
};
