"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { supabaseBrowser } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "success" | "failed";

export default function Page() {
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "failed") {
      toast({
        type: "error",
        description: "Бүртгүүлэх холбоос илгээж чадсангүй. Дахин оролдоорой.",
      });
    }
  }, [status]);

  const handleSubmit = async (formData: FormData) => {
    const e = String(formData.get("email") || "").trim();

    setEmail(e);
    setStatus("submitting");

    try {
      const supabase = supabaseBrowser();

      // Supabase-д "signup" нь email OTP-оор адилхан явж болно
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setIsSuccessful(false);
        setStatus("failed");
        return;
      }

      setIsSuccessful(true);
      setStatus("success");

      toast({
        type: "success",
        description:
          "Email руу баталгаажуулах холбоос илгээлээ. Inbox/Spam-аа шалгаарай.",
      });
    } catch {
      setIsSuccessful(false);
      setStatus("failed");
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Email-ээр бүртгүүлэх холбоос авах
          </p>
        </div>

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            {status === "submitting" ? "Sending link..." : "Send sign-up link"}
          </SubmitButton>

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
