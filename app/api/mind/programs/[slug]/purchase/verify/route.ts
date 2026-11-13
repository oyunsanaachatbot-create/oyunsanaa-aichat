import { auth } from "@/app/(auth)/auth";
import { getProgramPurchase, getProgramPurchaseByInvoice, getPublishedProgramBySlug, markProgramPurchasePaid } from "@/lib/db/queries";
import { checkPayment } from "@/lib/qpay/client";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { slug } = await params;
  const program = await getPublishedProgramBySlug(slug);
  if (program?.audience === "ORGANIZATION") return Response.json({ error: "organization_program_not_for_sale" }, { status: 403 });
  if (!program) return Response.json({ error: "program_not_found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { senderInvoiceNo?: string };
  const purchase = body.senderInvoiceNo ? await getProgramPurchaseByInvoice(body.senderInvoiceNo) : await getProgramPurchase(program.id, session.user.id);
  if (!purchase || purchase.programId !== program.id || purchase.buyerId !== session.user.id) return Response.json({ error: "purchase_not_found" }, { status: 404 });
  if (purchase.status === "PAID") return Response.json({ paid: true });
  if (!purchase.qpayInvoiceId) return Response.json({ paid: false, status: purchase.status });
  const check = await checkPayment(purchase.qpayInvoiceId);
  const payment = check.payments.find((row) => row.status === "PAID");
  if (!payment || check.paidAmount < purchase.amount) return Response.json({ paid: false, status: purchase.status, paidAmount: check.paidAmount });
  const settled = await markProgramPurchasePaid({ senderInvoiceNo: purchase.senderInvoiceNo, paymentId: payment.paymentId, paidAmount: check.paidAmount });
  return Response.json({ paid: settled.paid, status: settled.paid ? "PAID" : "PENDING" });
}
