import { after, NextResponse } from "next/server";

import { passwordResetRequestSchema } from "@/lib/auth/password-reset-validation";
import { requestPasswordReset } from "@/lib/email/password-reset";
import { logger, serializeError } from "@/lib/logger";

const MINIMUM_RESPONSE_MS = 300;

async function waitForMinimumResponse(startedAt: number) {
  const remaining = MINIMUM_RESPONSE_MS - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const parsed = passwordResetRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      await waitForMinimumResponse(startedAt);
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    after(async () => {
      try {
        await requestPasswordReset(parsed.data.email);
      } catch (error) {
        await logger.error(
          "password_reset_request_failed",
          serializeError(error)
        );
      }
    });
    await waitForMinimumResponse(startedAt);

    // This response deliberately never reveals whether the account exists.
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logger.error("password_reset_request_invalid", serializeError(error));
    await waitForMinimumResponse(startedAt);
    return NextResponse.json({ error: "REQUEST_FAILED" }, { status: 500 });
  }
}
