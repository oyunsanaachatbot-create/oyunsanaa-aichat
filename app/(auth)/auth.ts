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
        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD); // timing хамгаалалт
          return null;
        }

      const u = users[0];
if (!u.password) return null;

// ✅ Email verified биш бол нэвтрүүлэхгүй
if (!u.emailVerifiedAt) return null;

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
      // Login хийх үед (credentials/google/guest) user орж ирнэ
      if (user) {
        token.id = (user as any).id;
        token.type = ((user as any).type ?? "regular") as UserType;
        token.email = user.email ?? token.email;
      }

      const isGuest =
        token.type === "guest" ||
        String(token.email ?? "").endsWith("@guest.local");

      // Google login → DB user ensure (guest биш үед л)
      if (
        account?.provider === "google" &&
        !isGuest &&
        token.email &&
        !String(token.email).endsWith("@guest.local")
      ) {
        const dbId = await ensureUserIdByEmail(String(token.email));
        token.id = dbId;
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
