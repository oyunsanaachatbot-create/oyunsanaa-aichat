import { auth } from "@/app/(auth)/auth";
import { getProgramPurchase, getPublishedProgramBySlug } from "@/lib/db/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { slug } = await params;
  const program = await getPublishedProgramBySlug(slug);
  if (!program) return Response.json({ error: "program_not_found" }, { status: 404 });
  const purchase = await getProgramPurchase(program.id, session.user.id);
  return Response.json({ paid: program.price <= 0 || purchase?.status === "PAID", status: purchase?.status ?? null, purchaseId: purchase?.id ?? null, senderInvoiceNo: purchase?.senderInvoiceNo ?? null });
}
