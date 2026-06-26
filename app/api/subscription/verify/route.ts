import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { confirmPaymentBySenderInvoiceNo } from "@/lib/subscription/confirm";

/**
 * Frontend polls this after showing the QR to detect payment, since the QPay
 * callback can't reach localhost / non-public deployments.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  let senderInvoiceNo: string;
  try {
    const body = (await request.json()) as { senderInvoiceNo?: string };
    if (!body.senderInvoiceNo) throw new Error("missing senderInvoiceNo");
    senderInvoiceNo = body.senderInvoiceNo;
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const result = await confirmPaymentBySenderInvoiceNo(senderInvoiceNo);
    return Response.json(result);
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return new ChatSDKError(
      "bad_request:subscription",
      "Failed to verify payment."
    ).toResponse();
  }
}
