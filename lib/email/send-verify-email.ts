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

export async function sendVerifyEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "Oyunsanaa <no-reply@yourdomain.com>",
    to,
    subject: "Verify your email",
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.6">
        <h2>Email verification</h2>
        <p>Click the button below to verify your email:</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
            Verify email
          </a>
        </p>
        <p style="color:#666;font-size:12px">If you didn’t request this, ignore this email.</p>
      </div>
    `,
  });
}
