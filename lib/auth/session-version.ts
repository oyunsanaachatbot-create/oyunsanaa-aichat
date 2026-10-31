/** A versionless legacy JWT predates resets; never upgrade it past a reset. */
export function isCurrentSessionVersion(version: unknown, current: number | null, freshSignIn = false): boolean {
  return current !== null && Number.isSafeInteger(current) && current >= 0 && (freshSignIn || (version === undefined ? 0 : version) === current);
}
