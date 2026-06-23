import "server-only";

import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale, LOCALE_COOKIE } from "./config";
import type { Dictionary } from "./dictionaries/mn";

const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  mn: () => import("./dictionaries/mn"),
  en: () => import("./dictionaries/en"),
  ja: () => import("./dictionaries/ja"),
  ko: () => import("./dictionaries/ko"),
};

/** Read the locale from the cookie (falls back to the default). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Load the dictionary for the given (or cookie) locale. */
export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const loc = locale ?? (await getLocale());
  const mod = await loaders[loc]();
  return mod.default;
}
