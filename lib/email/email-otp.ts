import "server-only";
import {
  issueEmailVerificationOtp,
  type IssueEmailOtpResult,
} from "@/lib/db/queries";
import { sendEmailVerificationOtp } from "./send-email-otp";

export type RequestEmailOtpResult =
  | Exclude<IssueEmailOtpResult, { status: "issued" }>
  | { status: "sent" | "send_failed" };

export async function requestEmailVerificationOtp(
  email: string
): Promise<RequestEmailOtpResult> {
  const issued = await issueEmailVerificationOtp(email);
  if (issued.status !== "issued") return issued;

  try {
    await sendEmailVerificationOtp(email.trim().toLowerCase(), issued.code);
    return { status: "sent" };
  } catch {
    // Keep the issued challenge so a delayed provider delivery remains valid.
    // The user can request another code after the DB-backed cooldown.
    return { status: "send_failed" };
  }
}
