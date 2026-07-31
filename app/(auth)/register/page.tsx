"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useActionState, useEffect, useRef, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { useT } from "@/lib/i18n/provider";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpPending, setOtpPending] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const passwordRef = useRef("");

  const lastToastedStatusRef = useRef<string | null>(null);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  useEffect(() => {
    if (lastToastedStatusRef.current === state.status) return;
    lastToastedStatusRef.current = state.status;

    // submit дуусмагц button-г буцааж идэвхжүүлнэ
    if (state.status !== "idle") setIsSubmitting(false);

    if (state.status === "user_exists") {
      toast({ type: "error", description: t.auth.accountExists });
      setIsSuccessful(false);
      return;
    }

    if (state.status === "failed") {
      toast({ type: "error", description: t.auth.failedCreate });
      setIsSuccessful(false);
      return;
    }

    if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: t.auth.invalidSubmission,
      });
      setIsSuccessful(false);
      return;
    }

    if (state.status === "verification_required") {
      toast({
        type: state.otpSent ? "success" : "error",
        description: state.otpSent ? t.auth.otpSent : t.auth.otpSendFailed,
      });
      setVerificationRequired(true);
      return;
    }
  }, [state.otpSent, state.status, t]);

  const handleSubmit = (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    setEmail(String(formData.get("email") || ""));
    passwordRef.current = String(formData.get("password") || "");
    formAction(formData);
  };

  const verifyOtp = async () => {
    setOtpPending(true);
    const response = await fetch("/api/auth/email-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otpCode }),
    });

    if (!response.ok) {
      setOtpPending(false);
      toast({ type: "error", description: t.auth.otpInvalid });
      return;
    }

    const result = await signIn("credentials", {
      email,
      password: passwordRef.current,
      redirect: false,
    });
    setOtpPending(false);
    if (result?.error) {
      window.location.assign("/login");
      return;
    }
    setIsSuccessful(true);
    toast({ type: "success", description: t.auth.otpVerified });
    window.location.assign("/");
  };

  const resendOtp = async () => {
    setOtpPending(true);
    const response = await fetch("/api/auth/email-otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setOtpPending(false);
    toast({
      type: response.ok ? "success" : "error",
      description: response.ok ? t.auth.otpSent : t.auth.otpSendFailed,
    });
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            {verificationRequired ? t.auth.otpTitle : t.auth.signUpTitle}
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            {t.auth.signUpSubtitle}
          </p>
        </div>

        {verificationRequired ? (
          <div className="flex flex-col gap-4 px-4 sm:px-16">
            <p className="text-center text-gray-500 text-sm dark:text-zinc-400">
              {t.auth.otpSubtitle}
            </p>
            <input
              aria-label={t.auth.otpCode}
              autoComplete="one-time-code"
              className="rounded-md border bg-muted px-4 py-3 text-center font-semibold text-2xl tracking-[0.4em]"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              value={otpCode}
            />
            <button
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              disabled={otpPending || otpCode.length !== 6}
              onClick={verifyOtp}
              type="button"
            >
              {otpPending ? t.auth.otpVerifying : t.auth.otpVerify}
            </button>
            <button
              className="text-sm underline disabled:opacity-50"
              disabled={otpPending}
              onClick={resendOtp}
              type="button"
            >
              {t.auth.otpResend}
            </button>
          </div>
        ) : (
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>
              {t.auth.signUp}
            </SubmitButton>

            <button
              className="w-full rounded-md border px-4 py-2 text-sm"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              type="button"
            >
              {t.auth.googleSignIn}
            </button>

            <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
              {t.auth.alreadyHave}
              <Link
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                href="/login"
              >
                {t.auth.signInInstead}
              </Link>
            </p>
          </AuthForm>
        )}
      </div>
    </div>
  );
}
