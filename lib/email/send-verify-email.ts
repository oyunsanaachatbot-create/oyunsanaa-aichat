import "server-only";
import { resend } from "./resend";

function getAppUrl() {
  const url =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error(
      "Missing APP_URL (or NEXTAUTH_URL). Set it in Vercel Environment Variables."
    );
  }

  return url.replace(/\/+$/, "");
}

export async function sendVerifyEmail(params: { to: string; token: string }) {
  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(
    params.token
  )}`;

  const subject = "Oyunsanaa • Confirm your email";

  const html = `
  <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
    <h2>Confirm your email</h2>
    <p>Click the button below to verify your email address:</p>
    <p style="margin: 16px 0">
      <a href="${verifyUrl}"
         style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111827;color:white;text-decoration:none">
        Verify email
      </a>
    </p>
    <p>If the button doesn’t work, copy this link:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p style="color:#6b7280;margin-top:24px">This link expires in 30 minutes.</p>
  </div>`;

  const res = await resend.emails.send({
    from: "Oyunsanaa <no-reply@chat.oyunsanaa.com>",
    to: params.to,
    subject,
    html,
  });

  // Resend error байвал throw → actions дээр баригдана
  if ((res as any)?.error) {
    throw new Error((res as any).error.message || "Failed to send email");
  }

  return res;
}
