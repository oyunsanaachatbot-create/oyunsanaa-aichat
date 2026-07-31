import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailByOtp } from "@/lib/db/queries";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
  }

  const result = await verifyEmailByOtp(parsed.data.email, parsed.data.code);
  if (result.status === "verified" || result.status === "already_verified") {
    return NextResponse.json({ ok: true });
  }

  const status = result.status === "locked" ? 429 : 400;
  return NextResponse.json({ error: result.status.toUpperCase() }, { status });
}
