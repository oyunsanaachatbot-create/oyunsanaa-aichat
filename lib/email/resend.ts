import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("Missing RESEND_API_KEY. Set it in Vercel Environment Variables.");
}

export const resend = new Resend(apiKey);
