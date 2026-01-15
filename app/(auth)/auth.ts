import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, getUser, upsertOAuthUser } from "@/lib/db/queries";
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
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    // ✅ Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // profile() дээр шууд DB id өгч чадахгүй, тиймээс callback дээр DB-тэй холбоно
    }),

    // ✅ Email/Password
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          // timing хамгаалалт
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);
        if (!passwordsMatch) return null;

        return { id: user.id, email: user.email, type: "regular" as const };
      },
    }),

    // ✅ Guest
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { id: guestUser.id, email: guestUser.email, type: "guest" as const };
      },
    }),
  ],

  callbacks: {
    // ✅ Google sign-in үед DB дээр user үүсгээд DB id-г token-д суулгана
    async jwt({ token, user, account }) {
      // Credentials/Guest sign-in үед
      if (user) {
        token.id = (user.id as string) ?? token.id;
        token.type = (user.type as UserType) ?? token.type;
      }

      // Google sign-in үед
      if (account?.provider === "google") {
        const email = token.email as string | undefined;
        if (email) {
          const dbUser = await upsertOAuthUser(email);
          token.id = dbUser.id;
          token.type = "regular";
        }
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type as UserType;
      }
      return session;
    },
  },
});
