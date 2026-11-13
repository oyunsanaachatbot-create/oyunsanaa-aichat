"use client";

import {
  AppCard,
  AppShell,
  Badge,
  Button,
  PageHero,
} from "@/components/mind/app-shell";

export default function NutritionPage() {
  return (
    <AppShell subtitle="Өөрийгөө анхаарах" title="Хооллолт" width="3xl">
      <AppCard>
        <PageHero
          description="Хооллолтоо бүртгэж, биедээ тааруулсан хоногийн калори, ус, нойрны зорилтоо тавиарай."
          eyebrow={<Badge>Хувийн хөтөлбөр</Badge>}
          icon="🥗"
          title="Эрүүл мэндийн хөтөлбөр"
        />
        <div className="space-y-2.5">
          {[
            "Биеийн байдлаа үнэлэх асуулга бөглөх",
            "Хоногийн калори, ус, нойрны зорилт тооцоолох",
            "Өдөр бүрийн хооллолт, алхалт бүртгэх",
          ].map((item, i) => (
            <div
              className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3 text-sm"
              key={item}
              style={{ borderColor: "#E2E8F0" }}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full font-bold text-xs"
                style={{ background: "rgba(31,111,178,0.10)", color: "#1F6FB2" }}
              >
                {i + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Button className="w-full" href="/mind/self-care/health/questionnaire">
            Асуулга бөглөх →
          </Button>
        </div>
      </AppCard>
    </AppShell>
  );
}
