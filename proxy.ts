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

  // Secure cookie-ийн НЭР (`__Secure-authjs.session-token` эсэх) нь
  // NextAuth-д ЗӨВХӨН AUTH_URL-ийн протоколоор тодорхойлогддог
  // (next-auth v5 нь reqWithEnvURL-ээр request origin-ийг AUTH_URL болгож,
  //  useSecureCookies = url.protocol === "https:" гэж тооцдог).
  //
  // Тиймээс энд cookie уншихдаа МӨН ЛЭ AUTH_URL-ийг л эх сурвалж болгоно.
  // Хэрэв x-forwarded-proto (https) болон AUTH_URL (http) зөрвөл getToken буруу
  // нэрээр хайж session олдохгүй → /login руу мөнхийн давталт үүснэ.
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const isHttps = authUrl
    ? authUrl.startsWith("https://")
    : // AUTH_URL тохируулаагүй үед NextAuth proto-г x-forwarded-proto-оос авдаг
      request.headers.get("x-forwarded-proto") === "https" ||
      request.nextUrl.protocol === "https:";

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
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|icon-.*\\.png|apple-touch-icon.png|images/).*)",
  ],
};
