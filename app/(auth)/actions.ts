"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { createUser, getUser } from "@/lib/db/queries";
import { signIn } from "./auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export type RegisterActionState = {
  status: "idle" | "success" | "failed" | "user_exists" | "invalid_data";
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

    // 1️⃣ user үүсгэнэ
    await createUser(data.email, data.password);

    // 2️⃣ шууд sign in
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }
}
