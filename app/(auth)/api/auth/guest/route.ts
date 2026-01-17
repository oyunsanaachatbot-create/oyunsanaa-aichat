import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  // Зөвхөн guest-ээр sign in хийнэ
  await signIn("guest", {
    redirect: true,
    redirectTo: redirectUrl,
  });

  // NextAuth өөрөө redirect хийдэг ч Next.js буцаалт нэхдэг тул fallback
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
