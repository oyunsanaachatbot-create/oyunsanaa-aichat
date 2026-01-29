import type { TestDefinition } from "../types";

export const personalityBasic: TestDefinition = {
  id: "personality-basic",
  slug: "personality-basic",
  title: "Харилцааны хэв маяг (суурь)",
  subtitle: "Өөрийгөө таних богино тест",
  questions: [
    {
      id: "q1",
      text: "Би санал зөрөхөд ихэвчлэн…",
      options: [
        { label: "Бүрэн зайлсхийдэг", value: 0 },
        { label: "Арай тайван байх гэж оролддог", value: 1 },
        { label: "Дундаж", value: 2 },
        { label: "Шууд хэлдэг", value: 3 },
        { label: "Ширүүн эсэргүүцдэг", value: 4 },
      ],
    },
  ],
  bands: [
    { minPct: 0.75, title: "Өндөр", summary: "…", tips: ["…"] },
    { minPct: 0.5, title: "Дундаж", summary: "…", tips: ["…"] },
    { minPct: 0, title: "Бага", summary: "…", tips: ["…"] },
  ],
};
