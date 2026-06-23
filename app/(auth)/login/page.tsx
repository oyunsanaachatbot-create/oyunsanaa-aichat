"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { useT } from "@/lib/i18n/provider";

type Status = "idle" | "submitting" | "success" | "failed";

function safeCallback(url: string | null) {
  if (!url || !url.startsWith("/")) return "/";
  // auth хуудас руу буцаах нь давталт үүсгэдэг тул "/" руу
  if (/^\/(login|register)(\?|$)/.test(url)) return "/";
  return url;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  const t = useT();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "failed") {
      toast({
        type: "error",
        description: t.auth.invalidCredentials,
      });
    }
  }, [status, t]);

  const handleSubmit = async (formData: FormData) => {
    const e = String(formData.get("email") || "");
    const p = String(formData.get("password") || "");

    setEmail(e);
    setStatus("submitting");

    const res = await signIn("credentials", {
      email: e,
      password: p,
      redirect: false,
    });

    if (res?.error) {
      setIsSuccessful(false);
      setStatus("failed");
      return;
    }

    setIsSuccessful(true);
    setStatus("success");
    // Hard navigation — шинэ session cookie-тэйгээр бүтэн ачаална.
    // (router.replace нь зарим тохиолдолд proxy-той давтагдаж "stuck" болдог)
    window.location.assign(callbackUrl);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            {t.auth.signInTitle}
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            {t.auth.signInSubtitle}
          </p>
        </div>

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            {status === "submitting" ? t.auth.signingIn : t.auth.signIn}
          </SubmitButton>

          {/* ✅ Google login (NextAuth) */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-md border px-4 py-2 text-sm"
          >
            {t.auth.googleSignIn}
          </button>

          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {t.auth.noAccount}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/register"
            >
              {t.auth.signUpFree}
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
