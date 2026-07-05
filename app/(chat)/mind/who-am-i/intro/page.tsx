"use client";

import {
  AppCard,
  AppShell,
  Badge,
  Button,
  Muted,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";
import { useT } from "@/lib/i18n/provider";

export default function WhoAmIIntroPage() {
  const t = useT();
  const b = t.apps.lifeBalance;

  return (
    <AppShell backHref="/" title={b.pageTitles.intro} width="4xl">
      <AppCard>
        <PageHero
          description={b.intro.description}
          eyebrow={<Badge>{b.intro.eyebrow}</Badge>}
          icon="🧭"
          title={b.intro.title}
        />

        {b.intro.paragraphs.map((p) => (
          <Muted className="mb-4" key={p}>
            {p}
          </Muted>
        ))}

        <SectionHeading className="mb-2">
          {b.intro.bulletsHeading}
        </SectionHeading>
        <ul
          className="mb-6 space-y-1.5 text-sm leading-relaxed"
          style={{ color: "#334155" }}
        >
          {b.intro.bullets.map((bullet) => (
            <li className="flex items-start gap-2" key={bullet}>
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full"
                style={{ background: "#1F6FB2" }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <Button href="/mind/who-am-i/balance-test">{b.intro.checkBtn}</Button>
      </AppCard>
    </AppShell>
  );
}
