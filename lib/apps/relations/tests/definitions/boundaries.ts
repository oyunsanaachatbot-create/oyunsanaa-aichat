import type { TestDefinition, TestOptionValue } from "../types";

const OPTIONS: Array<{ value: TestOptionValue; label: string }> = [
  { value: 1, label: "Бараг үгүй" },
  { value: 2, label: "Хааяа" },
  { value: 3, label: "Ихэвчлэн" },
  { value: 4, label: "Байнга / Тийм" },
];

export const boundaries: TestDefinition = {
  id: "boundaries",
  slug: "boundaries",
  title: "Хил хязгаар тогтоох тест",
  subtitle: "10 асуулт · харилцаа",
  description: "Өөрийн хэрэгцээ, орон зай, цагийг хамгаалах чадварыг шалгана.",
  questions: [
    { id: "q1", text: "Дургүй зүйлдээ “үгүй” гэж хэлж чаддаг.", options: OPTIONS },
    { id: "q2", text: "Өөрийн хэрэгцээгээ буруутгалгүйгээр илэрхийлдэг.", options: OPTIONS },
    { id: "q3", text: "Хэт их ачаалал авах үедээ зогсоож чаддаг.", options: OPTIONS },
    { id: "q4", text: "Хэн нэгэн хүндлэлгүй харьцахад зөөлөн боловч тодорхой хэлдэг.", options: OPTIONS },
    { id: "q5", text: "“Надад бодох хугацаа хэрэгтэй” гэж хэлж чаддаг.", options: OPTIONS },
    { id: "q6", text: "Хувийн орон зай/цагийг хамгаалж чаддаг.", options: OPTIONS },
    { id: "q7", text: "Гэмшил/айдаснаасаа болоод зөвшөөрөөд байдаггүй.", options: OPTIONS },
    { id: "q8", text: "Хүмүүсийн асуудлыг өөр дээрээ үүрээд байдаггүй.", options: OPTIONS },
    { id: "q9", text: "Дүрэм, тохиролцоогоо сануулж чаддаг.", options: OPTIONS },
    { id: "q10", text: "Хилээ тогтоочихоод дараа нь буцаад эвгүйцээд өөрөө нураадаггүй.", options: OPTIONS },
  ],
  bands: [
    { minPct: 0.78, title: "Тодорхой хилтэй", summary: "Хил хязгаар сайн тогтоож чаддаг.", tips: ["“Үгүй” гэдгээ богино, зөөлөн хэлээд зогсоож сур."] },
    { minPct: 0.55, title: "Дунд", summary: "Зарим нөхцөлд хэлж чаддаг ч тогтворгүй байж магадгүй.", tips: ["“Надад 1 өдөр бодох хугацаа өгөөч” гэж хэвшүүл."] },
    { minPct: 0, title: "Сайжруулах", summary: "Хил тогтоох чадвар сул байна.", tips: ["Өөрийгөө буруутгахгүйгээр “Би одоо боломжгүй” гэж хэлж дад."] },
  ],
};
