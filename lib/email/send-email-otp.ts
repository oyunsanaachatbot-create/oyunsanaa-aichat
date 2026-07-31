import "server-only";
import { resend } from "./resend";

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Oyunsanaa <no-reply@chat.oyunsanaa.com>";

export async function sendEmailVerificationOtp(to: string, code: string) {
  const result = await resend.emails.send({
    from: FROM,
    to,
    subject: "Оюунсанаа • Имэйл баталгаажуулах код",
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
        <h2>Имэйл хаягаа баталгаажуулна уу</h2>
        <p>Оюунсанаа бүртгэлийн баталгаажуулах код:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
        <p>Код 10 минутын хугацаанд хүчинтэй. Энэ кодыг хэнд ч бүү дамжуулаарай.</p>
        <p style="color:#6b7280;font-size:12px">Та энэ бүртгэлийг эхлүүлээгүй бол уг имэйлийг үл тоомсорлоно уу.</p>
      </div>
    `,
  });

  if ((result as any)?.error) {
    throw new Error((result as any).error?.message ?? "Failed to send OTP");
  }
}
