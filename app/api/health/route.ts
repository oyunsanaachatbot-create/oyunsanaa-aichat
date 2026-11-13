import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status:"ok", revision:process.env.DEPLOYMENT_COMMIT ?? null }, { headers:{ "Cache-Control":"no-store" } });
}
