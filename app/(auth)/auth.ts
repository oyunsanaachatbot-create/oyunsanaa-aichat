import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, getUser } from "@/lib/db/queries";
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
    email?: string | null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    // ✅ Email + Password login
    Credentials({
      id: "credentials",
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
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

        return { ...user, type: "regular" as const };
      },
    }),

    // ✅ Guest login
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: "guest" as const };
      },
    }),
  ],

  callbacks: {
    // ✅ token дээр id/type-г баталгаажуулж хадгална
    async jwt({ token, user }) {
      // Login үед user орж ирнэ
      if (user) {
        token.id = (user as any).id as string;
        token.type = (user as any).type as UserType;
        token.email = user.email ?? token.email;
        return token;
      }

      // Дараагийн request-үүд дээр user байхгүй тул DB-ээр баталгаажуулна
      if (token.email) {
        const users = await getUser(token.email);
        if (users.length > 0) {
          const [dbUser] = users;

          const emailStr = typeof dbUser.email === "string" ? dbUser.email : "";
          const isGuestEmail = emailStr.startsWith("guest-");

          token.id = dbUser.id as string;
          token.type = isGuestEmail ? "guest" : "regular";
        }
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.type = (token.type as UserType) ?? "guest";
      }
      return session;
    },
  },
});
