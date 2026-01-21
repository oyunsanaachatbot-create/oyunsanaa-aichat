import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const all = cookieStore.getAll().map(c => c.name);

  const tokenA = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  return NextResponse.json({
    cookieNames: all,
    tokenExists: !!tokenA,
  });
}
