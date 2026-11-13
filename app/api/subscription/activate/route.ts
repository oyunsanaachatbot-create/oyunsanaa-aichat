/**
 * The former payment-bypass endpoint is intentionally retired. Keep a small
 * tombstone route so old clients receive an explicit response and cannot
 * activate a subscription without a verified QPay payment.
 */
export function POST() {
  return Response.json(
    { error: "Manual subscription activation is no longer available." },
    { status: 410 }
  );
}
