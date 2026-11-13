import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { logger, serializeError } from "@/lib/logger";
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
    const userId = await ensureUserIdByEmail(session.user.email);
    const result = await confirmPaymentBySenderInvoiceNo(
      senderInvoiceNo,
      "verify",
      userId
    );
    return Response.json(result);
  } catch (error) {
    await logger.error("payment_verify_failed", {
      senderInvoiceNo,
      email: session.user.email,
      error: serializeError(error),
    });
    return new ChatSDKError(
      "bad_request:subscription",
      "Failed to verify payment."
    ).toResponse();
  }
}
