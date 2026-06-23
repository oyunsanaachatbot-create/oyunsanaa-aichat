import type { Locale } from "./config";

export type ArtifactContent = { title: string; content: string };

/** An artifact whose `title`/`content` are the default (mn) with optional per-locale overrides. */
export type LocalizedArtifact = ArtifactContent & {
  i18n?: Partial<Record<Locale, ArtifactContent>>;
};

/** Pick the artifact's title/content for a locale, falling back to the default. */
export function resolveArtifact(
  a: LocalizedArtifact,
  locale: Locale
): ArtifactContent {
  const loc = a.i18n?.[locale];
  return {
    title: loc?.title ?? a.title,
    content: loc?.content ?? a.content,
  };
}
