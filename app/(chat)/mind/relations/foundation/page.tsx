"use client";

import * as React from "react";
import {
  AppCard,
  AppShell,
  Badge,
  Muted,
  OptionCard,
  PageHero,
} from "@/components/mind/app-shell";

const OPTIONS = [
  "Ойр дотно байхдаа тайван байдаг",
  "Ойртохоор түгшдэг",
  "Хэт их анхаарал хэрэгтэй санагддаг",
  "Бие даахыг илүүд үздэг",
];

export default function RelationshipStylePage() {
  const [style, setStyle] = React.useState<string>("");

  return (
    <AppShell title="Харилцааны хэв маяг" subtitle="Өөрийгөө ойлгох" width="3xl">
      <div className="space-y-4">
        <AppCard>
          <PageHero
            icon="🤝"
            eyebrow={<Badge>Өөрийгөө таних</Badge>}
            title="Харилцааны өөрийн хэв маяг"
            description="Хүн бүр харилцаанд өөр өөрөөр ханддаг. Энэ бол шүүлт биш, өөрийгөө ойлгох оролдлого юм."
          />

          <div className="space-y-2.5">
            {OPTIONS.map((q) => (
              <OptionCard
                key={q}
                selected={style === q}
                onClick={() => setStyle(q)}
                role="radio"
                aria-checked={style === q}
              >
                <span
                  aria-hidden
                  className="grid size-5 shrink-0 place-items-center rounded-full border"
                  style={{
                    borderColor: style === q ? "#1F6FB2" : "#CBD5E1",
                    background: style === q ? "#1F6FB2" : "transparent",
                    color: "#fff",
                    fontSize: 11,
                  }}
                >
                  {style === q ? "✓" : ""}
                </span>
                <span>{q}</span>
              </OptionCard>
            ))}
          </div>
        </AppCard>

        {style && (
          <AppCard>
            <Muted className="mb-1">Чиний сонголт:</Muted>
            <p className="font-semibold text-base">{style}</p>
            <Muted className="mt-2">
              Энэ хэв маяг сайн/муу гэсэн ангилал биш. Гагцхүү чи харилцаанд яаж
              хариу үзүүлдгээ анзаарч эхэлж байна.
            </Muted>
          </AppCard>
        )}
      </div>
    </AppShell>
  );
}
