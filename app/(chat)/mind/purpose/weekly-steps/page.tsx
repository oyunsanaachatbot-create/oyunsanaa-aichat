"use client";

import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
} from "@/components/mind/app-shell";

const UPCOMING = [
  "Зорилгоо 7 хоногт багтах жижиг алхам болгох",
  "Өдөр бүрийн биелэлтээ тэмдэглэх",
  "Долоо хоногийн ахицаа харах",
];

export default function WeeklyStepsPage() {
  return (
    <AppShell title="7 хоногийн алхам" subtitle="Жижиг алхмууд" width="3xl">
      <AppCard>
        <PageHero
          icon="📅"
          eyebrow={<Badge>Тун удахгүй</Badge>}
          title="7 хоногийн жижиг алхам"
          description="Зорилгоо долоо хоногт багтах жижиг, биелэх боломжтой алхмууд болгон хувааж, тэмдэглэж явна."
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
