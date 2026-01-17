"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";

// ⚠️ Чиний project дээр register action нэр өөр байж болно.
// Доорх import-оо өөрийнхтэй тааруулна:
import { register } from "../actions";

type Status = "idle" | "submitting" | "success" | "failed";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "failed") {
      toast({
        type: "error",
        description: "Registration failed!",
      });
    }
  }, [status]);

  const handleSubmit = async (formData: FormData) => {
    const e = String(formData.get("email") || "");
    const p = String(formData.get("password") || "");

    setEmail(e);
    setStatus("submitting");

    // 1) ✅ DB дээр public."User" үүсгэх (Supabase auth биш)
    const result = await register(formData);

    // register action чинь юу буцааж байгаагаас хамаарч энд шалгалт хийж болно.
    // Хамгийн энгийн: алдаа шидвэл catch-д орно гэж үзье.
    if ((result as any)?.status === "failed" || (result as any)?.error) {
      setIsSuccessful(false);
      setStatus("failed");
      return;
    }

    // 2) ✅ амжилттай бол шууд NextAuth credentials-р sign in
    const res = await signIn("credentials", {
      email: e,
      password: p,
      redirect: false,
    });

    if (res?.error) {
      toast({
        type: "error",
        description:
          "Account created, but sign-in failed. Please try signing in.",
      });
      setIsSuccessful(false);
      setStatus("failed");
      return;
    }

    setIsSuccessful(true);
    setStatus("success");
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Create an account with email and password
          </p>
        </div>

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            {status === "submitting" ? "Creating..." : "Create account"}
          </SubmitButton>

          {/* ✅ Google signup = Google sign-in (NextAuth) */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full rounded-md border px-4 py-2 text-sm"
          >
            Google-ээр бүртгүүлэх
          </button>

          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {"."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
