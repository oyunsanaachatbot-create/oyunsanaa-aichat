import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { DUMMY_PASSWORD } from "@/lib/constants";
import { ensureUserIdByEmail, getUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";
import { generateUUID } from "@/lib/utils";

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

  providers: [
    // ✅ Google (regular)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ Email / password (regular)
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize(credentials: any) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const users = await getUser(email);
        if (users.length === 0) {
          // timing attack хамгаалалт
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const user = users[0];
        if (!user.password) return null;

        const ok = await compare(password, user.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, type: "regular" as const };
      },
    }),

    // ✅ Guest (JWT ONLY, DB-д БИЧИХГҮЙ)
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        // DB insert хийхгүйгээр session token үүсгэнэ
        const id = `guest-${generateUUID()}`;
        const email = `${id}@guest.local`; // guestRegex үүнийг танина
        return { id, email, type: "guest" as const };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Login үед user ирнэ
      if (user?.id) {
        token.id = (user as any).id;
        token.type = (user as any).type ?? "regular";
        token.email = user.email ?? token.email;
        return token;
      }

      // Google login → DB user ensure (анх удаа орж ирэхэд User мөр үүсгэнэ)
      if (account?.provider === "google" && token.email) {
        const id = await ensureUserIdByEmail(token.email);
        token.id = id;
        token.type = "regular";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.type = (token.type ?? "regular") as UserType;
        // session.user.email стандарт талбар
        session.user.email = (token.email as string) ?? session.user.email;
      }
      return session;
    },
  },
});
