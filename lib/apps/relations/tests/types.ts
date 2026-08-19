import type { Locale } from "@/lib/i18n/config";

export type TestOptionValue = 0 | 1 | 2 | 3 | 4;

export type TestOption = {
  label: string;
  value: TestOptionValue;
  i18n?: Partial<Record<Locale, { label: string }>>;
};

export type TestQuestion = {
  id: string;
  text: string;
  options: TestOption[];
  i18n?: Partial<Record<Locale, { text: string }>>;
};

export type TestBand = {
  minPct: number; // 0..1
  title: string;
  summary: string;
  tips: string[];
  i18n?: Partial<
    Record<Locale, { title: string; summary: string; tips: string[] }>
  >;
};

export type TestDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  questions: TestQuestion[];
  bands: TestBand[]; // ✅ ЗӨВ
  origin?: "localized" | "international" | "platform";
  source?: {
    name: string;
    url?: string;
    usageRights: string;
  };
  i18n?: Partial<
    Record<Locale, { title: string; subtitle?: string; description?: string }>
  >;
};

export function resolveTestDefinition(test: TestDefinition, locale: Locale) {
  const loc = test.i18n?.[locale];
  return {
    ...test,
    title: loc?.title ?? test.title,
    subtitle: loc?.subtitle ?? test.subtitle,
    description: loc?.description ?? test.description,
    questions: test.questions.map((q) => ({
      ...q,
      text: q.i18n?.[locale]?.text ?? q.text,
      options: q.options.map((o) => ({
        ...o,
        label: o.i18n?.[locale]?.label ?? o.label,
      })),
    })),
    bands: test.bands.map((b) => ({
      ...b,
      title: b.i18n?.[locale]?.title ?? b.title,
      summary: b.i18n?.[locale]?.summary ?? b.summary,
      tips: b.i18n?.[locale]?.tips ?? b.tips,
    })),
  };
}
