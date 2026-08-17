"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";

const RESET_TOKEN_RE = /^[a-f0-9]{64}$/;

export function ResetPasswordForm() {
  const t = useT();
  const token = useSearchParams().get("token") ?? "";
  const tokenLooksValid = RESET_TOKEN_RE.test(token);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t.auth.resetMismatch);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      if (!response.ok) {
        setError(t.auth.resetInvalid);
        return;
      }
      setSucceeded(true);
    } catch {
      setError(t.auth.resetRequestError);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-8 rounded-2xl px-6 sm:px-16">
        <div className="space-y-2 text-center">
          <h1 className="font-semibold text-xl dark:text-zinc-50">
            {t.auth.resetTitle}
          </h1>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            {t.auth.resetSubtitle}
          </p>
        </div>

        {!tokenLooksValid ? (
          <p className="text-destructive text-sm" role="alert">
            {t.auth.resetInvalid}
          </p>
        ) : succeeded ? (
          <output className="block rounded-md border bg-muted p-4 text-sm">
            {t.auth.resetSuccess}
          </output>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.newPasswordLabel}</Label>
              <Input
                autoComplete="new-password"
                autoFocus
                id="password"
                maxLength={128}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <p className="text-muted-foreground text-xs">
                {t.auth.resetPasswordHint}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t.auth.confirmPasswordLabel}
              </Label>
              <Input
                autoComplete="new-password"
                id="confirm-password"
                maxLength={128}
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={isPending} type="submit">
              {isPending ? t.auth.resetSubmitting : t.auth.resetSubmit}
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
