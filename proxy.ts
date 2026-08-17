import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex } from "@/lib/constants";
import { logger } from "@/lib/logger";

// Интернэтийг бүхэлд нь скандаж эмзэг PHP/Laravel/WordPress сервер хайдаг
// ботуудын түгээмэл зам — Next.js апп-д ийм зам огт байхгүй тул шууд 404
// буцааж, login redirect + рендерийн дэмий ачааллаас сэргийлнэ.
const PROBE_PATH_RE =
  /\.(env|git|php|asp|aspx|cgi|yaml|yml|bak|ini|sql|sh)(\.|$|\/)|phpinfo|wp-(admin|login|content|includes)|\/owa\/|\/actuator|\/app_dev\.php|\/_profiler|\/cgi-bin|\/vendor\/|\/\.well-known\/(?!assetlinks|apple-app)|\/config\.(php|env|json)|\/secrets|\/debug\/default/i;

// Танигдсан crawler/scanner user-agent — log дээр bot:true гэж тэмдэглэнэ.
const BOT_UA_RE =
  /bot|crawler|spider|scan|zgrab|censys|xpanse|palo alto|ahrefs|semrush|meta-webindexer|chatgpt|gptbot|facebookexternalhit|python-requests|go-http-client/i;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPasswordResetPath =
    pathname === "/reset-password" ||
    pathname.startsWith("/api/auth/password-reset");

  const ua = request.headers.get("user-agent") ?? "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;

  // Халдлагын скан — тусдаа "security_probe" event-ээр warn түвшинд бичээд
  // шууд 404. (grep security_probe logs/*.log гэж тусад нь харна.)
  if (PROBE_PATH_RE.test(pathname)) {
    logger.warn("security_probe", { method: request.method, path: pathname, ip, userAgent: ua || undefined });
    return new Response("Not found", { status: 404 });
  }

  // Бүх request-ийг logs/app-YYYY-MM-DD.log руу бичнэ (fire-and-forget).
  // Жинхэнэ хэрэглэгчийн хөдөлгөөнийг харахдаа: grep -v '"bot":true'
  logger.info("request", {
    method: request.method,
    path: pathname,
    query: isPasswordResetPath ? undefined : search || undefined,
    ip,
    userAgent: ua || undefined,
    referer: isPasswordResetPath
      ? undefined
      : request.headers.get("referer") ?? undefined,
    ...(BOT_UA_RE.test(ua) ? { bot: true } : {}),
  });

  // ping
  if (pathname.startsWith("/ping")) return new Response("pong", { status: 200 });

  // nextauth routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // api (stream эвдрэхээс хамгаална)
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // auth pages
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return NextResponse.next();
  }

  // Secure cookie-ийн НЭР (`__Secure-authjs.session-token` эсэх) нь
  // NextAuth-д ЗӨВХӨН AUTH_URL-ийн протоколоор тодорхойлогддог
  // (next-auth v5 нь reqWithEnvURL-ээр request origin-ийг AUTH_URL болгож,
  //  useSecureCookies = url.protocol === "https:" гэж тооцдог).
  //
  // Тиймээс энд cookie уншихдаа МӨН ЛЭ AUTH_URL-ийг л эх сурвалж болгоно.
  // Хэрэв x-forwarded-proto (https) болон AUTH_URL (http) зөрвөл getToken буруу
  // нэрээр хайж session олдохгүй → /login руу мөнхийн давталт үүснэ.
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "";
  const isHttps = authUrl
    ? authUrl.startsWith("https://")
    : // AUTH_URL тохируулаагүй үед NextAuth proto-г x-forwarded-proto-оос авдаг
      request.headers.get("x-forwarded-proto") === "https" ||
      request.nextUrl.protocol === "https:";

  // Reverse proxy-н цаана request.url нь localhost болдог тул
  // redirected URL-д публик домэйн хэрэглэнэ.
  const publicOrigin = authUrl ? new URL(authUrl).origin : request.nextUrl.origin;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps,
  });

  // token байхгүй бол login руу (guest үүсгэхгүй)
  if (!token) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, publicOrigin)
    );
  }

  // guest token (хуучин session) бол мөн login руу — guest хандах эрхгүй
  const isGuest =
    (token as { type?: string })?.type === "guest" ||
    guestRegex.test(token?.email ?? "");
  if (isGuest) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, publicOrigin)
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
    "/forgot-password",
    "/reset-password",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|icon-.*\\.png|apple-touch-icon.png|images/).*)",
  ],
};
