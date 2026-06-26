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
  const senderInvoiceNo = new URL(request.url).searchParams.get("invoice");
  if (!senderInvoiceNo) {
    return new Response("MISSING_INVOICE", { status: 400 });
  }

  try {
    const result = await confirmPaymentBySenderInvoiceNo(senderInvoiceNo);
    if (result.paid) {
      return new Response("SUCCESS", { status: 200 });
    }
    // Not paid yet (or QPay says no) — acknowledge so QPay doesn't hammer us.
    return new Response("PENDING", { status: 200 });
  } catch (error) {
    console.error("QPay callback failed:", error);
    return new Response("ERROR", { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
