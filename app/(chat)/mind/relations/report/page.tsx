"use client";

import * as React from "react";
import {
  AppCard,
  AppShell,
  Badge,
  Field,
  Muted,
  PageHero,
  SectionHeading,
  TextArea,
} from "@/components/mind/app-shell";

export default function BoundariesPracticePage() {
  const [text, setText] = React.useState("");

  return (
    <AppShell title="Хил хязгаар" subtitle="Дасгал ба ажиглалт" width="3xl">
      <div className="space-y-4">
        {/* 1) ХИЛ ХЯЗГААРЫН ДАСГАЛ */}
        <AppCard>
          <PageHero
            icon="🛡️"
            eyebrow={<Badge>Дасгал</Badge>}
            title="Хил хязгаарын дасгал"
            description="Хил тогтооно гэдэг нь хүйтэн байх биш, өөрийгөө хамгаалах юм."
          />

          <div className="space-y-4">
            <Field label="Сүүлийн үед хил алдагдсан нэг нөхцөл">
              <TextArea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ж: би дуугүй байсаар зөвшөөрсөн..."
              />
            </Field>

            <div
              className="rounded-[16px] border p-4"
              style={{ borderColor: "#E2E8F0", background: "rgba(31,111,178,0.05)" }}
            >
              <Muted className="mb-1.5">Ингэж хэлж болох байсан:</Muted>
              <p className="font-medium text-sm leading-relaxed">
                “Одоо надад энэ тохиромжгүй байна. Дараа ярья.”
              </p>
            </div>
          </div>
        </AppCard>

        {/* 2) ХАРИЛЦААНЫ АЖИГЛАЛТ */}
        <AppCard>
          <SectionHeading>Харилцааны ажиглалт</SectionHeading>
          <Muted className="mt-2">
            Өнөөдөр нэг харилцааг шүүмжлэлгүйгээр ажиглаарай.
          </Muted>

          <ul className="mt-4 space-y-2.5">
            {[
              "Би ямар үед хамгаалалттай болчихов?",
              "Ямар үг, үйлдэл надад хүчтэй нөлөөлөв?",
              "Би юу хэлэхгүй үлдээв?",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed"
              >
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full"
                  style={{ background: "#1F6FB2" }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Muted className="mt-4">
            Энэ нь харилцааг шууд засах биш, өөрийгөө ойлгоход тусална.
          </Muted>
        </AppCard>
      </div>
    </AppShell>
  );
}
