import "server-only";

import {
  getPaymentBySenderInvoiceNo,
  markPaymentPaidAndExtend,
} from "@/lib/db/queries";
import { checkPayment } from "@/lib/qpay/client";

export type ConfirmResult = {
  paid: boolean;
  currentPeriodEnd: string | null;
  reason?: "not_found" | "no_invoice_id" | "not_paid";
};

/**
 * Verify a pending payment against QPay and, if paid, extend the user's
 * subscription. Shared by the polling endpoint and the QPay callback so both
 * paths are idempotent and behave identically.
 */
export async function confirmPaymentBySenderInvoiceNo(
  senderInvoiceNo: string
): Promise<ConfirmResult> {
  const payment = await getPaymentBySenderInvoiceNo(senderInvoiceNo);
  if (!payment) {
    return { paid: false, currentPeriodEnd: null, reason: "not_found" };
  }

  // Already settled — return the cached state without calling QPay again.
  if (payment.status === "paid") {
    const end = await markPaymentPaidAndExtend(senderInvoiceNo);
    return { paid: true, currentPeriodEnd: end?.toISOString() ?? null };
  }

  if (!payment.qpayInvoiceId) {
    return { paid: false, currentPeriodEnd: null, reason: "no_invoice_id" };
  }

  const check = await checkPayment(payment.qpayInvoiceId);
  if (!check.paid) {
    return { paid: false, currentPeriodEnd: null, reason: "not_paid" };
  }

  const end = await markPaymentPaidAndExtend(senderInvoiceNo);
  return { paid: true, currentPeriodEnd: end?.toISOString() ?? null };
}
