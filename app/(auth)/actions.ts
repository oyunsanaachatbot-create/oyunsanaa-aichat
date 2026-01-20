"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { createUser, getUser } from "@/lib/db/queries";
import { sendVerifyEmail } from "@/lib/email/send-verify-email";
import { signIn } from "./auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export type LoginActionState = {
  status: "idle" | "success" | "failed" | "invalid_data" | "needs_verification";
};

export async function login(
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");

    const data = schema.parse({ email, password });

    // ✅ Хэрэв user байгаа ч verified биш бол UI дээр хэлнэ
    const existing = await getUser(data.email);
    if (existing.length > 0 && !existing[0].emailVerifiedAt) {
      return { status: "needs_verification" };
    }

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    if (e instanceof AuthError) return { status: "failed" };
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
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");

    const data = schema.parse({ email, password });

    const existing = await getUser(data.email);
    if (existing.length > 0) return { status: "user_exists" };

    const created = await createUser(data.email, data.password);

    // createUser returning дээр token байгаа
    const token = created?.[0]?.emailVerificationToken;
    if (!token) throw new Error("Missing verification token");

    await sendVerifyEmail({ to: data.email, token });

    // ✅ Шууд sign in хийхгүй
    return { status: "needs_verification" };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }
}
