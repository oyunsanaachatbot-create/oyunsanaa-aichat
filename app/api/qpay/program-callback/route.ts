import { getProgramPurchaseByInvoice, markProgramPurchasePaid } from "@/lib/db/queries";
import { checkPayment } from "@/lib/qpay/client";

async function handle(request: Request) {
  const invoice = new URL(request.url).searchParams.get("invoice");
  if (!invoice) return new Response("MISSING_INVOICE", { status: 400 });
  const purchase = await getProgramPurchaseByInvoice(invoice);
  if (!purchase || !purchase.qpayInvoiceId) return new Response("NOT_FOUND", { status: 404 });
  if (purchase.status === "PAID") return new Response("SUCCESS", { status: 200 });
  const check = await checkPayment(purchase.qpayInvoiceId);
  const payment = check.payments.find((row) => row.status === "PAID");
  if (!payment || check.paidAmount < purchase.amount) return new Response("PENDING", { status: 200 });
  await markProgramPurchasePaid({ senderInvoiceNo: purchase.senderInvoiceNo, paymentId: payment.paymentId, paidAmount: check.paidAmount });
  return new Response("SUCCESS", { status: 200 });
}

export function GET(request: Request) { return handle(request); }
export function POST(request: Request) { return handle(request); }
