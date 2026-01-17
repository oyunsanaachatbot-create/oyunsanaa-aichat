import { signIn } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  // Token шалгахгүй. Зөвхөн guest-ээр оруулна.
  await signIn("guest", { redirect: true, redirectTo: redirectUrl });

  // NextAuth redirect хийчихдэг, гэхдээ TypeScript/Next-д буцаалт хэрэгтэй тул:
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
