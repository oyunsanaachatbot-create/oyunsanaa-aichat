"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { createUser, getUser } from "@/lib/db/queries";

/**
 * Template rule:
 * - actions.ts is ONLY for validation + DB writes/reads.
 * - DO NOT call next-auth signIn() here to avoid double sign-in + redirect bugs.
 */

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    // ✅ validate only
    authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // ✅ actual sign-in happens in client page via signIn("credentials")
    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) return { status: "invalid_data" };
    if (error instanceof AuthError) return { status: "failed" };
    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validated = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const users = await getUser(validated.email);
    const existing = Array.isArray(users) ? users[0] : (users as any);

    if (existing) {
      return { status: "user_exists" };
    }

    // ✅ create user in DB (should hash password inside createUser)
    await createUser(validated.email, validated.password);

    // ✅ actual sign-in happens in client page via signIn("credentials")
    return { status: "success" };
  } catch (error: any) {
    if (error instanceof z.ZodError) return { status: "invalid_data" };

    // ✅ Race-condition safety:
    // If DB has unique constraint on User.email, concurrent signup can throw.
    // Handle it as "user_exists".
    const msg = String(error?.message || "");
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return { status: "user_exists" };
    }

    return { status: "failed" };
  }
};
