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

  // Хэрвээ session/token байвал шинээр guest үүсгэхгүй, шууд redirect
  const token = await getToken({
    req: request as any,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Token байхгүй үед л guest signIn хийнэ (JWT only)
  await signIn("guest", { redirectTo: redirectUrl });

  // Fallback (зарим тохиолдолд signIn redirect хийсэн ч NextResponse хэрэгтэй байдаг)
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
