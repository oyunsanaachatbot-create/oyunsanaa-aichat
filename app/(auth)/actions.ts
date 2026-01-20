"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { createUser, getUser, createEmailVerification } from "@/lib/db/queries";
import { sendVerifyEmail } from "@/lib/email/resend";
import { signIn } from "./auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export type LoginActionState = {
  status: "idle" | "success" | "failed" | "invalid_data" | "not_verified";
};

export async function login(
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    const data = schema.parse({
      email: normalizeEmail(formData.get("email")),
      password: String(formData.get("password") ?? ""),
    });

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (e: any) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    if (e instanceof AuthError) {
      // authorize дээр “not_verified” throw хийвэл энд барина
      if (String(e?.cause?.err?.message || "").includes("not_verified")) {
        return { status: "not_verified" };
      }
      return { status: "failed" };
    }
    return { status: "failed" };
  }
}

export type RegisterActionState = {
  status:
    | "idle"
    | "needs_verification"
    | "failed"
    | "user_exists"
    | "invalid_data";
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
    if (existing.length > 0) return { status: "user_exists" };

    await createUser(data.email, data.password);

    // ✅ verification token үүсгээд email явуулна
    const { token } = await createEmailVerification(data.email);
    await sendVerifyEmail({ to: data.email, token });

    return { status: "needs_verification" };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }
}
