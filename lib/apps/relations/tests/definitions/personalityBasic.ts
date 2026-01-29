import type { TestDefinition } from "../types";

export const personalityBasic: TestDefinition = {
  id: "personality-basic",
  slug: "personality-basic",
  title: "Хувь хүний суурь тест",
  subtitle: "Өөрийгөө таних",
  questions: [
    {
      id: "q1",
      text: "Би сүүлийн үед ихэвчлэн…",
      options: [
        { label: "Тайван", value: 4 },
        { label: "Дунд", value: 2 },
        { label: "Стресстэй", value: 0 },
      ],
    },
    {
      id: "q2",
      text: "Хүмүүстэй харилцахад…",
      options: [
        { label: "Амархан", value: 4 },
        { label: "Дунд", value: 2 },
        { label: "Хэцүү", value: 0 },
      ],
    },
  ],
  bands: [
    { minPct: 0.75, title: "Сайн", summary: "Ерөнхий түвшин сайн байна.", tips: ["Энэ зуршлаараа үргэлжлүүл."] },
    { minPct: 0.45, title: "Дунд", summary: "Тэнцвэр дунд зэрэг.", tips: ["Өдөр тутам жижиг алхам хий."] },
    { minPct: 0.0, title: "Анхаарах", summary: "Одоогоор анхаарах зүйл байна.", tips: ["Амралт + ярилцах + тэмдэглэл."] },
  ],
};
