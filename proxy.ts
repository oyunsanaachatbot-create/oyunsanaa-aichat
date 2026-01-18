import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // тестэнд хэрэгтэй
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // ✅ NextAuth route-ууд
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ✅ ЧАТ/БУСАД API-г middleware-ээр redirect хийхгүй (ингэхгүй бол stream эвдэрнэ)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ✅ /login, /register дээр token шаардахгүй
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET, // доорх env тохиргоог бас шалгана
    secureCookie: !isDevelopmentEnvironment,
  });

  // ✅ token байхгүй бол guest рүү автоматаар шидэхгүй — /login руу явуулна
 if (!token) {
  // /login, /register бол зүгээр
  if (pathname === "/login" || pathname === "/register") return NextResponse.next();

  // хүссэн хуудсаа redirectUrl-д хадгална
  const redirectUrl = encodeURIComponent(`${pathname}${search}`);

  // ✅ Guest session үүсгээд дараа нь redirectUrl руу буцна
  return NextResponse.redirect(
    new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
  );
}


  // ✅ Login хийсэн (regular) хүн /login, /register руу орох гэвэл home руу
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
