import { NextResponse } from "next/server";

import { passwordResetConfirmSchema } from "@/lib/auth/password-reset-validation";
import { resetPasswordWithToken } from "@/lib/db/queries";
import { sendPasswordChangedEmail } from "@/lib/email/password-reset";
import { logger, serializeError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const parsed = passwordResetConfirmSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const result = await resetPasswordWithToken(
      parsed.data.token,
      parsed.data.password
    );
    if (result.status === "invalid") {
      return NextResponse.json(
        { error: "INVALID_OR_EXPIRED" },
        { status: 400 }
      );
    }

    try {
      await sendPasswordChangedEmail(result.email);
    } catch (error) {
      await logger.error(
        "password_changed_email_failed",
        serializeError(error)
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    await logger.error("password_reset_confirm_failed", serializeError(error));
    return NextResponse.json({ error: "RESET_FAILED" }, { status: 500 });
  }
}
