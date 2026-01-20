import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { DUMMY_PASSWORD } from "@/lib/constants";
import { getUser, ensureUserIdByEmail } from "@/lib/db/queries";
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
function createGuestIdentity() {
  const id =
    (globalThis.crypto?.randomUUID?.() ?? `g-${Date.now()}-${Math.random()}`)
      .toString()
      .replaceAll(" ", "");

  const email = `guest-${id}@guest.local`;
  return { id, email };
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
    /* ---------- Google (regular) ---------- */
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /* ---------- Email / password (regular) ---------- */
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize(credentials: any) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        const users = await getUser(email);

        // timing хамгаалалт
        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const u = users[0];

        // password байхгүй бол нэвтрүүлэхгүй
        if (!u.password) return null;

        // ✅ Email verified биш бол нэвтрүүлэхгүй
        // (DB дээр user.emailVerifiedAt field/column байх ёстой)
      

        const ok = await compare(password, u.password);
        if (!ok) return null;

        return { id: u.id, email: u.email, type: "regular" as const };
      },
    }),

    /* ---------- Guest (JWT ONLY, DB БИЧИХГҮЙ) ---------- */
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const guest = createGuestIdentity();
        return { id: guest.id, email: guest.email, type: "guest" as const };
      },
    }),
  ],

 callbacks: {
  async jwt({ token, user, account }) {
    // 1) login үед token дээр суулгана
    if (user) {
      token.id = (user as any).id;
      token.type = (user as any).type ?? "regular";
      token.email = user.email ?? token.email;
    }

    // 2) REGULAR user бол DB user id-г заавал ensure хийнэ
    // (Google болон credentials хоёуланд нь)
    const isRegular = (token.type ?? "regular") === "regular";
    if (isRegular && token.email) {
      const id = await ensureUserIdByEmail(token.email);
      token.id = id;
      token.type = "regular";
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      session.user.id = (token.id ?? session.user.id) as string;
      session.user.type = (token.type ?? "regular") as UserType;
    }
    return session;
  },
},

});
