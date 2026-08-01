/** Keep participant identity private: blank names use a role label, never email. */
export function displayParticipantName(
  name: string | null | undefined,
  fallback: string
): string {
  return name?.trim() || fallback;
}
