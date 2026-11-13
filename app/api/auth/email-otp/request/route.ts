import { NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailVerificationOtp } from "@/lib/email/email-otp";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const result = await requestEmailVerificationOtp(parsed.data.email);
  if (result.status === "cooldown") {
    return NextResponse.json(
      { error: "COOLDOWN", retryAfterSeconds: result.retryAfterSeconds },
      { status: 429 }
    );
  }
  if (result.status === "send_failed") {
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 503 });
  }

  // Do not reveal whether an account exists.
  return NextResponse.json({ ok: true });
}
