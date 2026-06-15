import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ping
  if (pathname.startsWith("/ping")) return new Response("pong", { status: 200 });

  // nextauth routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // api (stream эвдрэхээс хамгаална)
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // auth pages
  if (pathname === "/login" || pathname === "/register") return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  // token байхгүй бол login руу (guest үүсгэхгүй)
  if (!token) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  // guest token (хуучин session) бол мөн login руу — guest хандах эрхгүй
  const isGuest =
    (token as { type?: string })?.type === "guest" ||
    guestRegex.test(token?.email ?? "");
  if (isGuest) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    );
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
