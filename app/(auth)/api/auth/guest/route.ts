import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isDevelopmentEnvironment } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const token = await getToken({
    req: request,
 secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

    secureCookie: !isDevelopmentEnvironment,
  });

  // ✅ Хэрвээ already login-той бол шууд чат руу
  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // ✅ LOGIN хийгээгүй бол GUEST-ээр АВТО оруулахгүй.
  // Зүгээр л login page руу явуулна.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectUrl", redirectUrl);
  return NextResponse.redirect(loginUrl);
}
