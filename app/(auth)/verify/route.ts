import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/db/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/sign-in?verify=missing", req.url));
  }

  const ok = await verifyEmailToken(token);

  if (!ok) {
    return NextResponse.redirect(new URL("/auth/sign-in?verify=invalid", req.url));
  }

  return NextResponse.redirect(new URL("/auth/sign-in?verify=success", req.url));
}
