"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // ✅ нэмсэн
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "Account already exists!" });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Failed to create account!" });
    } else if (state.status === "invalid_data") {
      toast({ type: "error", description: "Failed validating your submission!" });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Account created successfully!" });
      setIsSuccessful(true);

      // ✅ хамгийн чухал: SignUp амжилттай болсны дараа автоматаар regular signIn хийнэ
      (async () => {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          toast({ type: "error", description: "Auto sign-in failed. Please sign in manually." });
          router.push("/login");
          return;
        }

        router.refresh();
        router.push("/");
      })();
    }
  }, [state.status]); // зориуд энгийнээр үлдээлээ

  const handleSubmit = (formData: FormData) => {
    const e = formData.get("email") as string;
    const p = formData.get("password") as string;

    setEmail(e);
    setPassword(p);

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
