import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const token = await getToken({
    req: request as any,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // already logged in → шууд буцаана
  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // guest sign in (JWT only)
  await signIn("guest", {
    redirect: true,
    redirectTo: redirectUrl,
  });

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
