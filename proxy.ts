import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ping
  if (pathname.startsWith("/ping")) return new Response("pong", { status: 200 });

  // NextAuth routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // API routes (stream эвдрэхээс хамгаална)
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Login/Register дээр token шаардахгүй
  if (pathname === "/login" || pathname === "/register") return NextResponse.next();

  const token = await getToken({
  req: request,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  secureCookie: !isDevelopmentEnvironment,
});


 const signedOut = request.nextUrl.searchParams.get("signedOut") === "1";

if (!token) {
  // ✅ Sign out хийсний дараа login дээр үлдээнэ (guest автоматаар үүсгэхгүй)
  if (signedOut && pathname === "/login") {
    return NextResponse.next();
  }

  // /login болон /register дээр guest автоматаар үүсгэхгүй
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  const redirectUrl = encodeURIComponent(`${pathname}${search}`);
  return NextResponse.redirect(
    new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
  );
}

    const redirectUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  // Regular хүн /login, /register руу орвол /
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
