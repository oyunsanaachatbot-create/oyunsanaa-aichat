import "server-only";
import { resend } from "./resend";

function getAppUrl() {
  const url =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error(
      "Missing APP_URL (or NEXTAUTH_URL / NEXT_PUBLIC_APP_URL) in Environment Variables."
    );
  }

  return url.replace(/\/+$/, "");
}

export async function sendVerifyEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const subject = "Oyunsanaa • Confirm your email";
  const html = `
  <div style="font-family:ui-sans-serif,system-ui;line-height:1.6">
    <h2>Email verification</h2>
    <p>Click the button below to verify your email:</p>
    <p>
      <a href="${verifyUrl}"
        style="display:inline-block;padding:10px 14px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">
        Verify email
      </a>
    </p>
    <p style="color:#666;font-size:12px">If the button doesn't work, copy this link:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p style="color:#666;font-size:12px">This link expires in 30 minutes.</p>
  </div>`;

  const res = await resend.emails.send({
    from: "Oyunsanaa <no-reply@chat.oyunsanaa.com>",
    to,
    subject,
    html,
  });

  // Resend error гарвал runtime дээр баригдах ёстой (actions дээр)
  if ((res as any)?.error) {
    throw new Error((res as any).error?.message ?? "Failed to send email");
  }

  return res;
}
