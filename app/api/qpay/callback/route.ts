import { logPaymentTransaction } from "@/lib/db/queries";
import { logger, serializeError } from "@/lib/logger";
import { confirmPaymentBySenderInvoiceNo } from "@/lib/subscription/confirm";

/**
 * QPay server-to-server callback. We register the callback URL with our own
 * `?invoice=<senderInvoiceNo>` appended, so we can look the payment up and
 * verify it against QPay before granting access. QPay may call this more than
 * once — confirmPaymentBySenderInvoiceNo is idempotent.
 *
 * QPay expects a 200 with "SUCCESS" on success.
 */
async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const senderInvoiceNo = url.searchParams.get("invoice");
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const body =
    request.method === "POST" ? await request.text().catch(() => null) : null;

  await logPaymentTransaction({
    event: "callback_received",
    source: "callback",
    senderInvoiceNo,
    ip,
    raw: { method: request.method, query: url.search, body },
  });
  logger.info("qpay_callback_received", {
    method: request.method,
    senderInvoiceNo,
    ip,
  });

  if (!senderInvoiceNo) {
    return new Response("MISSING_INVOICE", { status: 400 });
  }

  try {
    const result = await confirmPaymentBySenderInvoiceNo(
      senderInvoiceNo,
      "callback"
    );
    if (result.paid) {
      return new Response("SUCCESS", { status: 200 });
    }
    // Not paid yet (or QPay says no) — acknowledge so QPay doesn't hammer us.
    return new Response("PENDING", { status: 200 });
  } catch (error) {
    await logger.error("qpay_callback_failed", {
      senderInvoiceNo,
      error: serializeError(error),
    });
    await logPaymentTransaction({
      event: "error",
      source: "callback",
      senderInvoiceNo,
      ip,
      message: serializeError(error).message,
    });
    return new Response("ERROR", { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
