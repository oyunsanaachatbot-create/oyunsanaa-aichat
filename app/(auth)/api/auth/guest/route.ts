import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  // Хэрэв аль хэдийн token байвал шууд redirect
  const token = await getToken({
    req: request as any,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Зөвхөн энэ route-г хэрэглэсэн үед guest-р sign in хийнэ
  await signIn("guest", { redirect: true, redirectTo: redirectUrl });

  // fallback
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
