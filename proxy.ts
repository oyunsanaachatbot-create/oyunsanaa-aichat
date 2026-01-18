import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ping
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // nextauth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // api (stream эвдрэхээс хамгаална)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // auth pages: guest үүсгэхгүй, token шаардахгүй
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // ✅ Sign out хийсний дараа 1 удаа guest автоматаар үүсгэхгүй
  const signedOut = request.nextUrl.searchParams.get("signedOut") === "1";
  if (!token) {
    if (signedOut) {
      return NextResponse.next(); // logged-out хэвээр үлдээнэ
    }

    const redirectUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  // login хийсэн хүн /login,/register орох гэвэл /
  const isGuest = guestRegex.test(token?.email ?? "");
  if (!isGuest && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
