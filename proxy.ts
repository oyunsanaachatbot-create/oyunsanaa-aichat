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

  // Reverse-proxy (nginx) дотор nextUrl.protocol нь "http" болж,
  // secure cookie нэрийг буруу хайж session-ийг олохгүй → нэвтрэлтийн давталт үүсгэдэг.
  // Тиймээс forwarded proto болон AUTH_URL-ийг харгалзана.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const isHttps =
    forwardedProto === "https" ||
    request.nextUrl.protocol === "https:" ||
    authUrl.startsWith("https://");

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps,
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
