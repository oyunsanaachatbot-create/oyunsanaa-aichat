/** The first key issues sessions; previous keys only decode unexpired sessions. */
export function sessionSecrets(
  env: Record<string, string | undefined> = process.env
): string[] | undefined {
  const keys = [
    env.AUTH_SHARED_SECRET,
    env.AUTH_SHARED_PREVIOUS_SECRET,
    env.AUTH_SECRET,
    env.NEXTAUTH_SECRET,
  ].filter((key): key is string => Boolean(key));
  return keys.length ? [...new Set(keys)] : undefined;
}
