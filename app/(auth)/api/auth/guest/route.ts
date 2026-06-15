import { NextResponse } from "next/server";

function safeRedirect(path: string | null) {
  if (!path || typeof path !== "string") return "/";
  if (!path.startsWith("/")) return "/";
  return path;
}

// Guest хандалт хаагдсан — бүх хүсэлтийг login руу шилжүүлнэ.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = safeRedirect(searchParams.get("redirectUrl"));
  const callbackUrl = encodeURIComponent(redirectUrl);

  return NextResponse.redirect(
    new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
  );
}
