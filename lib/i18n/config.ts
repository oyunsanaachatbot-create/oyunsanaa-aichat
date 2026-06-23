export const locales = ["mn", "en", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "mn";

/** Cookie that stores the user's chosen locale (no URL change). */
export const LOCALE_COOKIE = "locale";

/** Native display names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  mn: "Монгол",
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
