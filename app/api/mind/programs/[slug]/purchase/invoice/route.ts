import { auth } from "@/app/(auth)/auth";
import { createProgramPurchase, getProgramPurchase, getPublishedProgramBySlug } from "@/lib/db/queries";
import { cancelInvoice, createInvoice, isQpayConfigured } from "@/lib/qpay/client";

const trimSlash = (value: string) => value.replace(/\/$/, "");

function baseUrl(request: Request) {
  return trimSlash(process.env.QPAY_CALLBACK_BASE_URL ?? process.env.APP_URL ?? process.env.AUTH_URL ?? new URL(request.url).origin);
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isQpayConfigured()) return Response.json({ error: "QPay тохируулагдаагүй байна." }, { status: 503 });
  const { slug } = await params;
  const program = await getPublishedProgramBySlug(slug);
  if (!program || program.renderer !== "BUILDER") return Response.json({ error: "program_not_found" }, { status: 404 });
  if (program.price <= 0) return Response.json({ paid: true, free: true });

  const existing = await getProgramPurchase(program.id, session.user.id);
  if (existing?.status === "PAID") return Response.json({ paid: true, purchaseId: existing.id });
  if (existing?.status === "PENDING" && existing.qrPayload && existing.qpayInvoiceId) {
    return Response.json({ paid: false, purchaseId: existing.id, senderInvoiceNo: existing.senderInvoiceNo, invoiceId: existing.qpayInvoiceId, qrText: existing.qrPayload, amount: existing.amount, currency: "MNT" });
  }

  const senderInvoiceNo = `PRG${session.user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}${program.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}${Date.now()}`;
  let invoice: Awaited<ReturnType<typeof createInvoice>> | null = null;
  try {
    invoice = await createInvoice({
      senderInvoiceNo,
      amount: program.price,
      description: `Oyunsanaa — ${program.definition.title}`,
      receiverCode: session.user.id.replace(/[^a-zA-Z0-9]/g, ""),
      callbackUrl: `${baseUrl(request)}/api/qpay/program-callback?invoice=${encodeURIComponent(senderInvoiceNo)}`,
    });
    const purchase = await createProgramPurchase({ programId: program.id, buyerId: session.user.id, amount: program.price, senderInvoiceNo, qpayInvoiceId: invoice.invoiceId, qrPayload: invoice.qrText });
    if (!purchase) throw new Error("purchase_not_created");
    return Response.json({ paid: false, purchaseId: purchase.id, senderInvoiceNo, invoiceId: invoice.invoiceId, qrText: invoice.qrText, qrImage: invoice.qrImage, urls: invoice.urls, amount: program.price, currency: "MNT" });
  } catch (error) {
    if (invoice) await cancelInvoice(invoice.invoiceId).catch(() => undefined);
    console.error("program_purchase_invoice_failed", error);
    return Response.json({ error: "Төлбөрийн нэхэмжлэл үүсгэж чадсангүй." }, { status: 502 });
  }
}
