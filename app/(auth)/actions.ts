import { z } from "zod";
import { AuthError } from "next-auth";
import { createUser, getUser, createEmailVerification } from "@/lib/db/queries";
import { sendVerifyEmail } from "@/lib/email/send-verify-email";
import { signIn } from "./auth";

// ... schema, normalizeEmail, types чинь хэвээрээ

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

    // 1) User үүсгэнэ (token буцаахгүй)
    await createUser(data.email, data.password);

    // 2) Verification token үүсгэнэ
    const { token } = await createEmailVerification(data.email);

    // 3) Email явуулна
    await sendVerifyEmail({ to: data.email, token });

    return { status: "needs_verification" };
  } catch (e) {
    if (e instanceof z.ZodError) return { status: "invalid_data" };
    if (e instanceof AuthError) return { status: "failed" };
    return { status: "failed" };
  }
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
