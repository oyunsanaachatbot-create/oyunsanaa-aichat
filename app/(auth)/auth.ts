import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

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

  // biome-ignore lint/nursery/useConsistentTypeDefinitions: "Required"
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
  providers: [
    // ✅ Google OAuth (NextAuth) - Supabase Auth хэрэггүй
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ Regular (email+password) - DB дээрх user/password ашиглана
    Credentials({
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

        if (!passwordsMatch) {
          return null;
        }

        return { ...user, type: "regular" };
      },
    }),

    // ✅ Guest - DB дээр guest user үүсгээд session-д суулгана
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: "guest" };
      },
    }),
  ],
 callbacks: {
  async jwt({ token, user, account }) {
    // 1) Credentials / Guest login үед user байгаа үед token-г set хийнэ
    if (user) {
      token.id = user.id as string;
      token.type = (user as any).type;
      token.email = user.email ?? token.email;
      return token;
    }

    // 2) Хэрвээ token дээр email байвал DB-ээс баталгаажуулж type-г зөв болгоно
    if (token.email) {
      const users = await getUser(token.email);

      // DB дээр байхгүй бол guest хэвээр
      if (users.length === 0) {
        token.type = "guest";
        return token;
      }

      const [dbUser] = users;

      // guest-үүдийн email чинь "guest-..." хэлбэртэй байгаа
      const isGuestEmail =
        typeof dbUser.email === "string" && dbUser.email.startsWith("guest-");

      token.id = dbUser.id as string;
      token.type = isGuestEmail ? "guest" : "regular";
      return token;
    }

    return token;
  },

  session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.type = token.type as any;
    }
    return session;
  },
},
