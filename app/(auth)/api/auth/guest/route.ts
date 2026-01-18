import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";

function safeRedirect(path: string | null) {
  if (!path || typeof path !== "string") return "/";
  if (!path.startsWith("/")) return "/";
  return path;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = safeRedirect(searchParams.get("redirectUrl"));

  const token = await getToken({
    req: request as any,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // session байвал дахиж guest хийхгүй
  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // session байхгүй үед guest sign-in
  await signIn("guest", { redirectTo: redirectUrl });

  // fallback (ихэнхдээ дээрх нь redirect хийнэ)
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
