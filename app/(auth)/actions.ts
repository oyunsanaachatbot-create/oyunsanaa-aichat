"use server";

import { z } from "zod";
import { compare } from "bcrypt-ts";
import { createUser, getUser } from "@/lib/db/queries";
import { requestEmailVerificationOtp } from "@/lib/email/email-otp";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export type RegisterActionState = {
  status:
    | "idle"
    | "verification_required"
    | "failed"
    | "user_exists"
    | "invalid_data";
  otpSent?: boolean;
};

export async function register(
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  try {
    const data = schema.parse({
      email: normalizeEmail(formData.get("email")),
      password: String(formData.get("password") ?? ""),
    });

    const existing = await getUser(data.email);
    if (existing.length > 0) {
      const current = existing[0];
      if (
        !current.emailVerifiedAt &&
        current.password &&
        (await compare(data.password, current.password))
      ) {
        const otp = await requestEmailVerificationOtp(data.email);
        return {
          status: "verification_required",
          otpSent: otp.status === "sent" || otp.status === "cooldown",
        };
      }
      return { status: "user_exists" };
    }

    await createUser(data.email, data.password);
    const otp = await requestEmailVerificationOtp(data.email);
    return {
      status: "verification_required",
      otpSent: otp.status === "sent",
    };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }
}
