import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = "Oyunsanaa <no-reply@chat.oyunsanaa.com>"; 
// ⚠️ Домэйн Resend дээр verified болоогүй бол түр:
// const FROM_EMAIL = "Oyunsanaa <onboarding@resend.dev>";

export async function sendVerifyEmail(params: { to: string; token: string }) {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(
    params.token
  )}`;

  const subject = "Oyunsanaa • Confirm your email";

  const html = `
  <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
    <h2>Confirm your email</h2>
    <p>Click the button below to verify your email address:</p>
    <p style="margin:16px 0">
      <a href="${verifyUrl}"
         style="display:inline-block;padding:10px 14px;border-radius:10px;
                background:#111827;color:white;text-decoration:none">
        Verify email
      </a>
    </p>
    <p>If the button doesn’t work, copy this link:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p style="color:#6b7280;margin-top:24px">This link expires in 30 minutes.</p>
  </div>`;

  const res = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject,
    html,
  });

  // Resend error ирвэл build унагаахгүйгээр throw хийнэ (actions дээр баригдана)
  if ((res as any)?.error) {
    throw new Error((res as any).error?.message || "Failed to send email");
  }

  return res;
}
