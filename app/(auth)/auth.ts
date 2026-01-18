import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { DUMMY_PASSWORD } from "@/lib/constants";
import { ensureUserIdByEmail, getUser } from "@/lib/db/queries";
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
    id?: string;
    type?: UserType;
  }
}

/* ---------------- helpers ---------------- */

function makeGuest() {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // ⚠️ DB-д орохгүй “хийсвэр” email (зөвхөн session-д)
  const email = `guest-${id}@guest.local`;
  return { id, email, type: "guest" as const };
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Regular email/pass
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize(credentials: any) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const users = await getUser(email);
        if (users.length === 0) {
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

    // ✅ Guest (JWT only) — DB БИЧИХГҮЙ
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        return makeGuest();
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // signIn болсон үед (credentials/google/guest бүгд энд орно)
      if (user) {
        token.id = (user as any).id;
        token.type = ((user as any).type ?? "regular") as UserType;
        token.email = user.email ?? token.email;
        return token;
      }

      // Google login → DB user ensure (зөвхөн regular)
      if (account?.provider === "google" && token.email) {
        const id = await ensureUserIdByEmail(token.email);
        token.id = id;
        token.type = "regular";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? "") as string;
        session.user.type = ((token.type ?? "regular") as UserType) ?? "regular";
      }
      return session;
    },
  },
});
