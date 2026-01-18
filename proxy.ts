import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isDevelopmentEnvironment } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // -------------------------
  // 1. health / ping
  // -------------------------
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // -------------------------
  // 2. NextAuth routes (хааж БОЛОХГҮЙ)
  // -------------------------
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // -------------------------
  // 3. API routes (stream эвдрэхээс хамгаална)
  // -------------------------
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // -------------------------
  // 4. Auth pages (login/register)
  // -------------------------
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // -------------------------
  // 5. Session шалгана
  // -------------------------
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // -------------------------
  // 6. Token байхгүй → LOGIN руу л явуулна
  // ❌ энд guest автоматаар үүсгэх ЁСГҮЙ
  // -------------------------
  if (!token) {
    const redirectUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  // -------------------------
  // 7. Login хийсэн хүн login/register орох гэвэл /
  // -------------------------
  if (
    token &&
    (pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // -------------------------
  // 8. Бусад бүх тохиолдолд OK
  // -------------------------
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
