import { auth } from "@/app/(auth)/auth";
import {
  createPaymentInvoice,
  ensureUserIdByEmail,
  logPaymentTransaction,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { logger, serializeError } from "@/lib/logger";
import { CURRENCY, PRICE_MNT } from "@/lib/subscription/config";
import { createInvoice, isQpayConfigured } from "@/lib/qpay/client";

/** Resolve the public base URL QPay should call back to. */
function getBaseUrl(request: Request): string {
  const fromEnv =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  if (!isQpayConfigured()) {
    return new ChatSDKError(
      "bad_request:subscription",
      "QPay is not configured. Set QPAY_USERNAME / QPAY_PASSWORD / QPAY_INVOICE_CODE."
    ).toResponse();
  }

  const userId = await ensureUserIdByEmail(session.user.email);

  // Unique, traceable idempotency key for this invoice.
  const senderInvoiceNo = `SUB-${userId.slice(0, 8)}-${Date.now()}`;
  const baseUrl = getBaseUrl(request);
  const callbackUrl = `${baseUrl}/api/qpay/callback?invoice=${senderInvoiceNo}`;

  try {
    const invoice = await createInvoice({
      senderInvoiceNo,
      amount: PRICE_MNT,
      description: "Oyunsanaa Chat — сарын багц (1 сар)",
      receiverCode: userId.slice(0, 45),
      callbackUrl,
    });

    await createPaymentInvoice({
      userId,
      senderInvoiceNo,
      qpayInvoiceId: invoice.invoice_id,
      amount: PRICE_MNT,
      currency: CURRENCY,
    });

    await logPaymentTransaction({
      event: "invoice_created",
      source: "invoice",
      userId,
      senderInvoiceNo,
      qpayInvoiceId: invoice.invoice_id,
      amount: PRICE_MNT,
      currency: CURRENCY,
    });
    logger.info("qpay_invoice_created", {
      userId,
      senderInvoiceNo,
      qpayInvoiceId: invoice.invoice_id,
      amount: PRICE_MNT,
    });

    return Response.json({
      senderInvoiceNo,
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,
      urls: invoice.urls,
      amount: PRICE_MNT,
      currency: CURRENCY,
    });
  } catch (error) {
    await logger.error("qpay_invoice_create_failed", {
      userId,
      senderInvoiceNo,
      error: serializeError(error),
    });
    await logPaymentTransaction({
      event: "error",
      source: "invoice",
      userId,
      senderInvoiceNo,
      amount: PRICE_MNT,
      currency: CURRENCY,
      message: serializeError(error).message,
    });
    return new ChatSDKError(
      "bad_request:subscription",
      "Failed to create payment invoice."
    ).toResponse();
  }
}
