import "server-only";

import { Resend } from "resend";

type SendVerifyEmailArgs = {
  to: string;
  token: string;
};

function getBaseUrl() {
  // PROD дээр APP_URL тавьсан нь хамгийн зөв
  const url =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  // VERCEL_URL заримдаа домайнгүй ирдэг тул https:// нэмнэ
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export async function sendVerifyEmail({ to, token }: SendVerifyEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(apiKey);

  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const from =
    process.env.RESEND_FROM ||
    "Oyunsanaa <onboarding@resend.dev>"; // түр default (дараа өөрийн verified домэйнээр солино)

  const subject = "Verify your email";

  const html = `
  <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6;">
    <h2 style="margin: 0 0 12px;">Verify your email</h2>
    <p style="margin: 0 0 16px;">
      Click the button below to verify your email address.
    </p>
    <p style="margin: 0 0 18px;">
      <a href="${verifyUrl}"
         style="display:inline-block;padding:10px 14px;border-radius:8px;
                background:#111;color:#fff;text-decoration:none;">
        Verify email
      </a>
    </p>
    <p style="margin:0;color:#666;font-size:12px;">
      If the button doesn't work, copy and paste this link:<br/>
      <span>${verifyUrl}</span>
    </p>
  </div>
  `;

  const text = `Verify your email:\n${verifyUrl}`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    // Resend error-г log-д гаргая
    console.error("Resend send error:", error);
    throw new Error(error.message || "Failed to send verification email");
  }

  return { ok: true as const, id: data?.id };
}
