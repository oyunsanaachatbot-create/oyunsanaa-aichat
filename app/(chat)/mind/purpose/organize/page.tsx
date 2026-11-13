"use client";

import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
} from "@/components/mind/app-shell";

const UPCOMING = [
  "Чөлөөт бичсэн зорилгуудаа автоматаар бүлэглэх",
  "Чухал зэрэг, хугацаагаар эрэмбэлэх",
  "Дэс дараатай, ойлгомжтой төлөвлөгөө болгох",
];

export default function PurposeOrganizePage() {
  return (
    <AppShell title="Зорилго цэгцлэх" subtitle="Oyunsanaa цэгцлэлт" width="3xl">
      <AppCard>
        <PageHero
          icon="🧩"
          eyebrow={<Badge>Тун удахгүй</Badge>}
          title="Oyunsanaa цэгцлэх"
          description="Чөлөөтэй бичсэн зорилгуудаа AI тусламжтайгаар ойлгомжтой, дэс дараатай төлөвлөгөө болгон цэгцэлнэ."
        />

        <ul className="space-y-2.5">
          {UPCOMING.map((item, i) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3 text-sm"
              style={{ borderColor: "#E2E8F0" }}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full font-bold text-xs"
                style={{ background: "rgba(31,111,178,0.10)", color: "#1F6FB2" }}
              >
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </AppCard>
    </AppShell>
  );
}
