import "server-only";

/**
 * Minimal QPay v2 merchant API client.
 *
 * QPay has no native recurring billing, so a "subscription" here is just a
 * fresh invoice issued each month; on payment we extend the user's period.
 *
 * Required env:
 *   QPAY_USERNAME       merchant API username
 *   QPAY_PASSWORD       merchant API password
 *   QPAY_INVOICE_CODE   invoice template code from QPay
 * Optional:
 *   QPAY_BASE_URL       defaults to https://merchant.qpay.mn/v2
 */

const BASE_URL = process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn/v2";

type QpayToken = {
  access_token: string;
  expires_at: number; // epoch ms
};

let cachedToken: QpayToken | null = null;

export function isQpayConfigured(): boolean {
  return Boolean(
    process.env.QPAY_USERNAME &&
      process.env.QPAY_PASSWORD &&
      process.env.QPAY_INVOICE_CODE
  );
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 60_000) {
    return cachedToken.access_token;
  }

  const username = process.env.QPAY_USERNAME ?? "";
  const password = process.env.QPAY_PASSWORD ?? "";
  const basic = Buffer.from(`${username}:${password}`).toString("base64");

  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`QPay auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };

  cachedToken = {
    access_token: data.access_token,
    // expires_in is seconds; default to 1h if missing.
    expires_at: now + (data.expires_in ?? 3600) * 1000,
  };

  return cachedToken.access_token;
}

export type QpayInvoice = {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 png (no data: prefix)
  urls: Array<{ name: string; description: string; link: string }>;
};

export async function createInvoice(params: {
  senderInvoiceNo: string;
  amount: number;
  description: string;
  receiverCode: string;
  callbackUrl: string;
}): Promise<QpayInvoice> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: params.senderInvoiceNo,
      invoice_receiver_code: params.receiverCode,
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`QPay invoice create failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    invoice_id: string;
    qr_text: string;
    qr_image: string;
    urls: Array<{ name: string; description: string; link: string }>;
  };

  return {
    invoice_id: data.invoice_id,
    qr_text: data.qr_text,
    qr_image: data.qr_image,
    urls: data.urls ?? [],
  };
}

export type QpayPaymentCheck = {
  paid: boolean;
  paidAmount: number;
  /** Raw /payment/check response body, kept for the payment audit trail. */
  raw: unknown;
};

/**
 * Check whether an invoice has been paid. QPay returns the matching payment
 * rows; we consider it paid when at least one row is in PAID state.
 */
export async function checkPayment(
  qpayInvoiceId: string
): Promise<QpayPaymentCheck> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: qpayInvoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`QPay payment check failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    count: number;
    paid_amount: number;
    rows?: Array<{ payment_status?: string }>;
  };

  const paid =
    (data.count ?? 0) > 0 &&
    (data.rows ?? []).some((r) => r.payment_status === "PAID");

  return { paid, paidAmount: data.paid_amount ?? 0, raw: data };
}
