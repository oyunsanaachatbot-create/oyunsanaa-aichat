import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/queries";
import { programPurchase } from "@/lib/db/schema";
import { auth } from "@/app/(auth)/auth";
import { getProgramPurchase, getPublishedProgramBySlug } from "@/lib/db/queries";
import { createInvoice, isQpayConfigured } from "@/lib/qpay/client";

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
  if (program.audience === "ORGANIZATION") return Response.json({ error: "organization_program_not_for_sale" }, { status: 403 });
  if (program.price <= 0) return Response.json({ paid: true, free: true });

  const claim = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`program-purchase:${session.user.id}:${program.id}`}, 0))`);
    let [purchase] = await tx.select().from(programPurchase).where(and(eq(programPurchase.programId, program.id), eq(programPurchase.buyerId, session.user.id))).limit(1);
    if (!purchase) {
      [purchase] = await tx.insert(programPurchase).values({ programId: program.id, buyerId: session.user.id,
        amount: program.price, senderInvoiceNo: `PRG${randomUUID().replaceAll("-", "")}`, status: "PENDING" }).returning();
    }
    if (!purchase || purchase.status !== "PENDING" || purchase.qpayInvoiceId) return { purchase, claimed: false };
    const [claimed] = await tx.update(programPurchase).set({ status: "INVOICE_CREATING", updatedAt: new Date() })
      .where(and(eq(programPurchase.id, purchase.id), eq(programPurchase.status, "PENDING"))).returning();
    return { purchase, claimed: !!claimed };
  });
  const purchase = claim.purchase;
  if (!purchase) return Response.json({ error: "purchase_not_created" }, { status: 500 });
  if (purchase.status === "PAID") return Response.json({ paid: true, purchaseId: purchase.id });
  if (purchase.qpayInvoiceId && purchase.qrPayload) return Response.json({ paid: false, purchaseId: purchase.id, senderInvoiceNo: purchase.senderInvoiceNo,
    invoiceId: purchase.qpayInvoiceId, qrText: purchase.qrPayload, amount: purchase.amount, currency: "MNT" });
  if (!claim.claimed) return Response.json({ error: purchase.status === "PAYMENT_REVIEW" ? "payment_review_required" : "invoice_in_progress", purchaseId: purchase.id }, { status: 409 });
  const senderInvoiceNo = purchase.senderInvoiceNo;
  let invoice: Awaited<ReturnType<typeof createInvoice>> | null = null;
  try {
    invoice = await createInvoice({
      senderInvoiceNo,
      amount: purchase.amount,
      description: `Oyunsanaa — ${program.definition.title}`,
      receiverCode: session.user.id.replace(/[^a-zA-Z0-9]/g, ""),
      callbackUrl: `${baseUrl(request)}/api/qpay/program-callback?invoice=${encodeURIComponent(senderInvoiceNo)}`,
    });
    const [saved] = await db.update(programPurchase).set({ status: "PENDING", qpayInvoiceId: invoice.invoiceId, qrPayload: invoice.qrText, updatedAt: new Date() })
      .where(and(eq(programPurchase.id, purchase.id), eq(programPurchase.status, "INVOICE_CREATING"))).returning();
    if (!saved) throw new Error("purchase_not_saved");
    return Response.json({ paid: false, purchaseId: purchase.id, senderInvoiceNo, invoiceId: invoice.invoiceId, qrText: invoice.qrText, qrImage: invoice.qrImage, urls: invoice.urls, amount: purchase.amount, currency: "MNT" });
  } catch (error) {
    await db.update(programPurchase).set({ status: "PAYMENT_REVIEW", ...(invoice ? { qpayInvoiceId: invoice.invoiceId, qrPayload: invoice.qrText } : {}), updatedAt: new Date() })
      .where(and(eq(programPurchase.id, purchase.id), eq(programPurchase.status, "INVOICE_CREATING")));

    console.error("program_purchase_invoice_failed", { purchaseId: purchase.id });
    return Response.json({ error: "Төлбөрийн нэхэмжлэл үүсгэж чадсангүй." }, { status: 502 });
  }
}
