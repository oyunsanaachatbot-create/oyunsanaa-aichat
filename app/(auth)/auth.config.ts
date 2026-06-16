import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // AUTH_URL (v5) takes priority over NEXTAUTH_URL (v4 compat), then SDK-derived baseUrl
      const base =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        baseUrl;

      // Relative paths → always prepend the canonical base
      if (url.startsWith("/")) { return `${base}${url}`; }

      // Absolute URLs on the same origin → allow
      try {
        if (new URL(url).origin === new URL(base).origin) { return url; }
      } catch {
        // malformed URL — fall through to safe default
      }

      // Anything else (different domain, internal IP, etc.) → redirect to base
      return base;
    },
  },
} satisfies NextAuthConfig;
