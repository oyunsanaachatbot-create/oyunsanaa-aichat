"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setHasError(false);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Password reset request failed");
      setSubmitted(true);
    } catch {
      setHasError(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-8 rounded-2xl px-6 sm:px-16">
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-xl dark:text-zinc-50">
            {t.auth.resetRequestTitle}
          </h1>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            {t.auth.resetRequestSubtitle}
          </p>
        </div>

        {submitted ? (
          <output className="block rounded-md border bg-muted p-4 text-sm">
            {t.auth.resetRequestSuccess}
          </output>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.emailLabel}</Label>
              <Input
                autoComplete="email"
                autoFocus
                id="email"
                maxLength={320}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            {hasError && (
              <p className="text-destructive text-sm" role="alert">
                {t.auth.resetRequestError}
              </p>
            )}
            <Button className="w-full" disabled={isPending} type="submit">
              {isPending
                ? t.auth.resetRequestSubmitting
                : t.auth.resetRequestSubmit}
            </Button>
          </form>
        )}

        <Link className="text-center text-sm hover:underline" href="/login">
          {t.auth.backToSignIn}
        </Link>
      </div>
    </main>
  );
}
