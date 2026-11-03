const LEADING_DOT = /^\./;
const COOKIE_DOMAIN = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
/** Optional cross-subdomain cookie. Leave unset for localhost/port-based staging. */
export function sharedSessionCookie(
  env: Record<string, string | undefined> = process.env
) {
  const configured = env.AUTH_COOKIE_DOMAIN?.trim();
  if (!configured) return {};
  const domain = configured.replace(LEADING_DOT, "").toLowerCase();
  const origin = new URL(env.AUTH_URL ?? env.NEXTAUTH_URL ?? env.APP_URL ?? "");
  if (
    origin.protocol !== "https:" ||
    !COOKIE_DOMAIN.test(domain) ||
    !domain.includes(".") ||
    domain.includes("..") ||
    !(origin.hostname === domain || origin.hostname.endsWith(`.${domain}`))
  )
    throw new Error(
      "AUTH_COOKIE_DOMAIN must be an HTTPS origin's parent domain"
    );
  return {
    cookies: {
      sessionToken: {
        name: "__Secure-oyunsanaa.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path: "/",
          secure: true,
          domain,
        },
      },
    },
  };
}
