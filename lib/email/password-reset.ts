import "server-only";

import {
  deletePasswordResetToken,
  issuePasswordResetToken,
} from "@/lib/db/queries";
import { logger, serializeError } from "@/lib/logger";
import { resend } from "./resend";

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Oyunsanaa <no-reply@chat.oyunsanaa.com>";

function getAppOrigin(): string {
  const configuredUrl =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) {
    throw new Error(
      "Missing AUTH_URL, NEXTAUTH_URL, APP_URL, or NEXT_PUBLIC_APP_URL"
    );
  }

  const url = new URL(configuredUrl);
  const localDevelopmentUrl =
    process.env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !localDevelopmentUrl) {
    throw new Error("Password reset URL must use HTTPS");
  }

  return url.origin;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const issued = await issuePasswordResetToken(email);
  if (issued.status !== "issued") return;

  try {
    const resetUrl = `${getAppOrigin()}/reset-password?token=${encodeURIComponent(issued.token)}`;
    const result = await resend.emails.send({
      from: FROM,
      to: issued.email,
      subject: "Оюунсанаа • Нууц үг сэргээх",
      html: `
        <div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
          <h2>Нууц үгээ сэргээх</h2>
          <p>Доорх товчийг дарж шинэ нууц үг тохируулна уу.</p>
          <p>
            <a href="${resetUrl}"
              style="display:inline-block;padding:10px 14px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">
              Нууц үг шинэчлэх
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px">Холбоос нэг цагийн хугацаанд, зөвхөн нэг удаа хүчинтэй.</p>
          <p style="color:#6b7280;font-size:12px">Та энэ хүсэлтийг гаргаагүй бол уг имэйлийг үл тоомсорлоно уу.</p>
        </div>
      `,
    });

    if (result.error) throw new Error(result.error.message);
  } catch (error) {
    await deletePasswordResetToken(issued.token).catch(() => {
      // Best effort: the stored hash expires even if cleanup is unavailable.
    });
    await logger.error("password_reset_email_failed", serializeError(error));
  }
}

export async function sendPasswordChangedEmail(email: string): Promise<void> {
  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Оюунсанаа • Нууц үг шинэчлэгдлээ",
    html: `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.6;color:#111827">
        <h2>Нууц үг шинэчлэгдлээ</h2>
        <p>Таны Оюунсанаа бүртгэлийн нууц үг амжилттай шинэчлэгдсэн.</p>
        <p>Хэрэв та энэ өөрчлөлтийг хийгээгүй бол манай дэмжлэгийн багтай яаралтай холбогдоно уу.</p>
      </div>
    `,
  });

  if (result.error) throw new Error(result.error.message);
}
