import { auth } from "@/app/(auth)/auth";
import {
  ensureUserIdByEmail,
  getPaymentBySenderInvoiceNo,
  logPaymentTransaction,
  markPaymentInvoiceCancelled,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { logger, serializeError } from "@/lib/logger";
import { cancelInvoice, qpayErrorCode, QpayError } from "@/lib/qpay/client";
import { confirmPaymentBySenderInvoiceNo } from "@/lib/subscription/confirm";

const SENDER_INVOICE_NO = /^[a-zA-Z0-9]{1,64}$/;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  let senderInvoiceNo: string;
  try {
    const body = (await request.json()) as { senderInvoiceNo?: unknown };
    if (
      typeof body.senderInvoiceNo !== "string" ||
      !SENDER_INVOICE_NO.test(body.senderInvoiceNo)
    ) {
      throw new Error("missing senderInvoiceNo");
    }
    senderInvoiceNo = body.senderInvoiceNo;
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const userId = await ensureUserIdByEmail(session.user.email);
  const payment = await getPaymentBySenderInvoiceNo(senderInvoiceNo);
  if (!payment || payment.userId !== userId) {
    return new ChatSDKError(
      "not_found:subscription",
      "Төлбөрийн нэхэмжлэх олдсонгүй."
    ).toResponse();
  }

  if (payment.status === "paid") {
    return Response.json({ paid: true, status: "paid" }, { status: 409 });
  }
  if (payment.status !== "pending") {
    return Response.json({ paid: false, status: "cancelled" });
  }
  if (!payment.qpayInvoiceId) {
    return new ChatSDKError(
      "bad_request:subscription",
      "QPay нэхэмжлэхийн дугаар олдсонгүй."
    ).toResponse();
  }

  try {
    await cancelInvoice(payment.qpayInvoiceId);
  } catch (error) {
    if (error instanceof QpayError && qpayErrorCode(error) === "INVOICE_PAID") {
      const confirmed = await confirmPaymentBySenderInvoiceNo(
        senderInvoiceNo,
        "cancel",
        userId
      );
      if (confirmed.paid) {
        return Response.json(
          {
            paid: true,
            status: "paid",
            currentPeriodEnd: confirmed.currentPeriodEnd,
          },
          { status: 409 }
        );
      }
    }

    await logger.error("qpay_invoice_cancel_failed", {
      userId,
      senderInvoiceNo,
      qpayInvoiceId: payment.qpayInvoiceId,
      error: serializeError(error),
    });
    await logPaymentTransaction({
      event: "error",
      source: "cancel",
      userId,
      senderInvoiceNo,
      qpayInvoiceId: payment.qpayInvoiceId,
      amount: payment.amount,
      currency: payment.currency,
      message: serializeError(error).message,
    });
    return new ChatSDKError(
      "bad_request:subscription",
      "Төлбөрийг цуцалж чадсангүй. Дахин оролдоно уу."
    ).toResponse();
  }

  const cancelled = await markPaymentInvoiceCancelled(senderInvoiceNo, userId);
  if (!cancelled) {
    const latest = await getPaymentBySenderInvoiceNo(senderInvoiceNo);
    if (latest?.status === "paid") {
      return Response.json({ paid: true, status: "paid" }, { status: 409 });
    }
  }

  await logPaymentTransaction({
    event: "payment_cancelled",
    source: "cancel",
    userId,
    senderInvoiceNo,
    qpayInvoiceId: payment.qpayInvoiceId,
    amount: payment.amount,
    currency: payment.currency,
  });
  logger.info("qpay_invoice_cancelled", {
    userId,
    senderInvoiceNo,
    qpayInvoiceId: payment.qpayInvoiceId,
  });

  return Response.json({ paid: false, status: "cancelled" });
}
