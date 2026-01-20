import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  // build үед шууд унагаахгүй, зөвхөн runtime дээр email хэрэглэх үед алдаа өгнө.
  console.warn("RESEND_API_KEY is missing. Email sending will not work.");
}

export const resend = new Resend(apiKey ?? ""); // ✅ хамгийн чухал нь: EXPORT
