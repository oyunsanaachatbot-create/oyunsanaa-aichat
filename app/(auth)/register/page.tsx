"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useActionState, useEffect, useRef, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ toast давхардахгүй болгох guard
  const lastToastedStatusRef = useRef<string | null>(null);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

 useEffect(() => {
  if (lastToastedStatusRef.current === state.status) return;
  lastToastedStatusRef.current = state.status;

  if (state.status !== "idle") setIsSubmitting(false);

  if (state.status === "user_exists") {
    toast({ type: "error", description: "Account already exists!" });
    setIsSuccessful(false);
    return;
  }

  if (state.status === "failed") {
    toast({ type: "error", description: "Failed to create account!" });
    setIsSuccessful(false);
    return;
  }

  if (state.status === "invalid_data") {
    toast({ type: "error", description: "Failed validating your submission!" });
    setIsSuccessful(false);
    return;
  }

  if (state.status === "needs_verification") {
    toast({
      type: "success",
      description: "Account created. Check your email to verify, then sign in.",
    });
    setIsSuccessful(true);

    // redirect хийх эсэхээ сонго:
    router.replace("/login"); // хүсэхгүй бол энэ мөрийг comment болгоод болно
    return;
  }
}, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    setEmail(String(formData.get("email") || ""));
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full rounded-md border px-4 py-2 text-sm"
          >
            Google-ээр нэвтрэх
          </button>

          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
