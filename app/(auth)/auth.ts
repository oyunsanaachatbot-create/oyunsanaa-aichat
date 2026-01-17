import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, ensureUserIdByEmail, getUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    type?: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  // ✅ ЧУХАЛ: secret нэг газраас
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ Email + Password (DB user/password)
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize(credentials: any) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) return null;

        const users = await getUser(email);

        // user байхгүй бол timing-attack хамгаалалт
        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        // password NULL бол login зөвшөөрөхгүй
        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const ok = await compare(password, user.password);
        if (!ok) return null;

        return { ...user, type: "regular" };
      },
    }),

    // ✅ Guest provider
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const created = await createGuestUser();

        // createGuestUser() чинь returning array буцаадаг тул хамгаалалт
        const guestUser = Array.isArray(created) ? created[0] : (created as any);

        if (!guestUser?.id) return null;

        return { ...guestUser, type: "guest" };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // 1) credentials/guest үед user объект ирнэ
      if (user?.id) {
        token.id = user.id as string;
        token.type = (user as any).type ?? "regular";
        token.email = user.email ?? token.email;
        return token;
      }

      // 2) Google OAuth үед token.email ирдэг → DB user-г ensure хийнэ
      if (account?.provider === "google" && token.email) {
        const dbUserId = await ensureUserIdByEmail(token.email);
        token.id = dbUserId;
        token.type = "regular";
        return token;
      }

      return token;
    },

    async session({ session, token }) {
      // ✅ хамгаалалт: token.id байхгүй бол crash хийхгүй
      if (session.user) {
        session.user.id = (token.id ?? "") as string;
        session.user.type = (token.type ?? "regular") as UserType;
      }
      return session;
    },
  },
});
