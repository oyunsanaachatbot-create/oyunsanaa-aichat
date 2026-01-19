import Link from "next/link";
import { verifyEmailByToken } from "@/lib/db/queries";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const token =
    typeof searchParams.token === "string"
      ? searchParams.token
      : Array.isArray(searchParams.token)
        ? searchParams.token[0]
        : "";

  const result = token
    ? await verifyEmailByToken(token)
    : ({ ok: false as const });

  return (
    <div className="mx-auto max-w-md p-6">
      {result.ok ? (
        <>
          <h1 className="text-xl font-semibold">Email verified ✅</h1>
          <p className="mt-2">Now you can sign in.</p>
          <Link className="mt-4 inline-block underline" href="/login">
            Go to Sign In
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Invalid or expired link</h1>
          <p className="mt-2">Please request a new verification email.</p>
          <Link className="mt-4 inline-block underline" href="/login">
            Back to Sign In
          </Link>
        </>
      )}
    </div>
  );
}
