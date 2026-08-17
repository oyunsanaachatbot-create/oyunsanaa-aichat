import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { DUMMY_PASSWORD } from "@/lib/constants";
import {
  ensureUserIdByEmail,
  getUser,
  getUserAuthVersionById,
  markUserEmailVerified,
} from "@/lib/db/queries";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

/* ---------------- types ---------------- */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    authVersion?: number;
    id?: string;
    type?: UserType;
  }
}

/* ---------------- auth ---------------- */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,

  providers: [
    /* ---------- Google (regular) ---------- */
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    /* ---------- Email / password (regular) ---------- */
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize(credentials: any) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) { return null; }

        const users = await getUser(email);

        // timing хамгаалалт
        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const u = users[0];

        if (!u.password) { return null; }
        if (!u.emailVerifiedAt) { return null; }

        const ok = await compare(password, u.password);
        if (!ok) { return null; }

        return { id: u.id, email: u.email, type: "regular" as const };
      },
    }),
  ],

  callbacks: {
    redirect({ url, baseUrl }) {
      const base = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? baseUrl;
      if (url.startsWith("/")) { return `${base}${url}`; }
      try {
        if (new URL(url).origin === new URL(base).origin) { return url; }
      } catch { /* malformed url — fall through */ }
      return base;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.type = (user as any).type ?? "regular";
        token.email = user.email ?? token.email;

        // Ensure the DB row exists and get the canonical ID.
        // Done once at sign-in, never on every request.
        const isRegular = (token.type ?? "regular") === "regular";
        if (isRegular && token.email) {
          const id = await ensureUserIdByEmail(token.email, user.name);
          // OAuth providers have already verified ownership of this email.
          await markUserEmailVerified(token.email);
          token.id = id;
          token.type = "regular";
        }
      }

      const isRegular = (token.type ?? "regular") === "regular";
      if (isRegular && token.id) {
        const currentAuthVersion = await getUserAuthVersionById(token.id);
        if (currentAuthVersion === null) return null;

        if (user || token.authVersion === undefined) {
          // Existing sessions are upgraded on their first request after deploy.
          token.authVersion = currentAuthVersion;
        } else if (token.authVersion !== currentAuthVersion) {
          // A password reset increments this value and revokes every old JWT.
          return null;
        }
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? session.user.id) as string;
        session.user.type = (token.type ?? "regular") as UserType;
      }
      return session;
    },
  },
});
