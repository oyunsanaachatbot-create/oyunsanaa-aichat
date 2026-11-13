import "server-only";

import {
  getPaymentBySenderInvoiceNo,
  logPaymentTransaction,
  markPaymentPaidAndExtend,
  type PaymentLogSource,
} from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { checkPayment } from "@/lib/qpay/client";

export type ConfirmResult = {
  paid: boolean;
  currentPeriodEnd: string | null;
  reason?: "not_found" | "no_invoice_id" | "not_paid" | "wrong_user";
};

/**
 * Verify a pending payment against QPay and, if paid, extend the user's
 * subscription. Shared by the polling endpoint and the QPay callback so both
 * paths are idempotent and behave identically.
 *
 * `source` records which entry point triggered the check in the payment
 * audit trail (PaymentTransactionLog).
 */
export async function confirmPaymentBySenderInvoiceNo(
  senderInvoiceNo: string,
  source: PaymentLogSource = "verify",
  expectedUserId?: string
): Promise<ConfirmResult> {
  const payment = await getPaymentBySenderInvoiceNo(senderInvoiceNo);
  if (!payment) {
    await logPaymentTransaction({
      event: "error",
      source,
      senderInvoiceNo,
      message: "payment row not found",
    });
    return { paid: false, currentPeriodEnd: null, reason: "not_found" };
  }

  if (expectedUserId && payment.userId !== expectedUserId) {
    await logPaymentTransaction({
      event: "error",
      source,
      userId: expectedUserId,
      senderInvoiceNo,
      message: "payment does not belong to authenticated user",
    });
    return { paid: false, currentPeriodEnd: null, reason: "wrong_user" };
  }

  // Already settled — return the cached state without calling QPay again.
  if (payment.status === "paid") {
    const end = await markPaymentPaidAndExtend(senderInvoiceNo);
    return { paid: true, currentPeriodEnd: end?.toISOString() ?? null };
  }

  if (!payment.qpayInvoiceId) {
    await logPaymentTransaction({
      event: "error",
      source,
      userId: payment.userId,
      senderInvoiceNo,
      message: "payment row has no qpayInvoiceId",
    });
    return { paid: false, currentPeriodEnd: null, reason: "no_invoice_id" };
  }

  const check = await checkPayment(payment.qpayInvoiceId);
  await logPaymentTransaction({
    event: "qpay_check",
    source,
    userId: payment.userId,
    senderInvoiceNo,
    qpayInvoiceId: payment.qpayInvoiceId,
    amount: payment.amount,
    currency: payment.currency,
    message:
      check.paid && check.paidAmount >= payment.amount
        ? "paid_in_full"
        : `not_paid_in_full (${check.paidAmount}/${payment.amount})`,
    raw: check.raw,
  });

  // Provider status alone is insufficient: grant access only once the full
  // amount stored on our invoice has been paid.
  if (!check.paid || check.paidAmount < payment.amount) {
    return { paid: false, currentPeriodEnd: null, reason: "not_paid" };
  }

  const end = await markPaymentPaidAndExtend(senderInvoiceNo);
  await logPaymentTransaction({
    event: "payment_confirmed",
    source,
    userId: payment.userId,
    senderInvoiceNo,
    qpayInvoiceId: payment.qpayInvoiceId,
    amount: payment.amount,
    currency: payment.currency,
    message: `subscription extended to ${end?.toISOString() ?? "null"}`,
  });
  logger.info("payment_confirmed", {
    senderInvoiceNo,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    source,
    currentPeriodEnd: end?.toISOString() ?? null,
  });

  return { paid: true, currentPeriodEnd: end?.toISOString() ?? null };
}
