import "server-only";

const DEFAULT_BASE_URL = "https://merchant.qpay.mn";
const REQUEST_TIMEOUT_MS = 15_000;
const TOKEN_EXPIRY_SKEW_MS = 60_000;
const TRAILING_SLASH = /\/$/;
const TRAILING_V2 = /\/v2$/;

type TokenState = {
  accessToken: string;
  expiresAt: number;
};

export type QpayUrl = {
  name: string;
  description?: string;
  logo?: string;
  link: string;
};

export type QpayInvoice = {
  invoiceId: string;
  qrText: string;
  qrImage: string | null;
  urls: QpayUrl[];
};

export type QpayPayment = {
  paymentId: string;
  status: string;
  amount: number;
  raw: unknown;
};

export class QpayError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "QpayError";
    this.status = status;
    this.details = details;
  }
}

let tokenState: TokenState | null = null;
let tokenRequest: Promise<TokenState> | null = null;

function config() {
  const clientId = process.env.QPAY_CLIENT_ID;
  const clientSecret = process.env.QPAY_CLIENT_SECRET;
  const invoiceCode = process.env.QPAY_INVOICE_CODE;

  if (!(clientId && clientSecret && invoiceCode)) {
    throw new QpayError(
      "QPay is not configured. QPAY_CLIENT_ID, QPAY_CLIENT_SECRET and QPAY_INVOICE_CODE are required."
    );
  }

  // Accept the old `/v2` form too, but keep endpoint versioning in one place.
  const baseUrl = (process.env.QPAY_BASE_URL ?? DEFAULT_BASE_URL)
    .replace(TRAILING_SLASH, "")
    .replace(TRAILING_V2, "");

  return { baseUrl, clientId, clientSecret, invoiceCode };
}

export function isQpayConfigured(): boolean {
  return Boolean(
    process.env.QPAY_CLIENT_ID &&
      process.env.QPAY_CLIENT_SECRET &&
      process.env.QPAY_INVOICE_CODE
  );
}

async function responseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

async function requestToken(): Promise<TokenState> {
  const { baseUrl, clientId, clientSecret } = config();
  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString(
    "base64"
  );
  const response = await fetch(`${baseUrl}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await responseBody(response);

  if (!response.ok) {
    throw new QpayError(
      errorMessage(body, "QPay authentication failed"),
      response.status,
      body
    );
  }

  const value = body && typeof body === "object" ? body : {};
  const token = (value as { access_token?: unknown }).access_token;
  const expiresIn = Number((value as { expires_in?: unknown }).expires_in);
  if (typeof token !== "string" || !token) {
    throw new QpayError(
      "QPay authentication returned no access token",
      response.status,
      body
    );
  }

  // QPay may return either an epoch timestamp or a duration in seconds.
  const now = Date.now();
  const expiresAt = Number.isFinite(expiresIn)
    ? expiresIn > now / 1000 + 86_400
      ? expiresIn * 1000
      : now + expiresIn * 1000
    : now + 10 * 60 * 1000;

  return { accessToken: token, expiresAt };
}

async function accessToken(forceRefresh = false): Promise<string> {
  if (
    !forceRefresh &&
    tokenState &&
    tokenState.expiresAt - TOKEN_EXPIRY_SKEW_MS > Date.now()
  ) {
    return tokenState.accessToken;
  }

  if (!tokenRequest) {
    tokenRequest = requestToken()
      .then((next) => {
        tokenState = next;
        return next;
      })
      .finally(() => {
        tokenRequest = null;
      });
  }
  return (await tokenRequest).accessToken;
}

async function qpayRequest(
  path: string,
  init: RequestInit,
  retry = true
): Promise<unknown> {
  const { baseUrl } = config();
  const token = await accessToken();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 401 && retry) {
    tokenState = null;
    await accessToken(true);
    return qpayRequest(path, init, false);
  }

  const body = await responseBody(response);
  if (!response.ok) {
    throw new QpayError(
      errorMessage(body, `QPay request failed (${response.status})`),
      response.status,
      body
    );
  }
  return body;
}

export async function createInvoice(params: {
  senderInvoiceNo: string;
  amount: number;
  description: string;
  receiverCode: string;
  callbackUrl: string;
}): Promise<QpayInvoice> {
  const { invoiceCode } = config();
  const body = await qpayRequest("/v2/invoice", {
    method: "POST",
    body: JSON.stringify({
      invoice_code: invoiceCode,
      sender_invoice_no: params.senderInvoiceNo,
      invoice_receiver_code: params.receiverCode,
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  if (!body || typeof body !== "object") {
    throw new QpayError(
      "QPay returned an invalid invoice response",
      undefined,
      body
    );
  }
  const value = body as Record<string, unknown>;
  if (
    typeof value.invoice_id !== "string" ||
    typeof value.qr_text !== "string"
  ) {
    throw new QpayError(
      "QPay invoice response is missing invoice_id or qr_text",
      undefined,
      body
    );
  }

  const urls = Array.isArray(value.urls)
    ? value.urls.filter(
        (url): url is QpayUrl =>
          Boolean(url) &&
          typeof url === "object" &&
          typeof (url as QpayUrl).name === "string" &&
          typeof (url as QpayUrl).link === "string"
      )
    : [];

  return {
    invoiceId: value.invoice_id,
    qrText: value.qr_text,
    qrImage: typeof value.qr_image === "string" ? value.qr_image : null,
    urls,
  };
}

export async function checkPayment(qpayInvoiceId: string): Promise<{
  paid: boolean;
  paidAmount: number;
  payments: QpayPayment[];
  raw: unknown;
}> {
  const body = await qpayRequest("/v2/payment/check", {
    method: "POST",
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: qpayInvoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  const rows =
    body &&
    typeof body === "object" &&
    Array.isArray((body as { rows?: unknown }).rows)
      ? (body as { rows: unknown[] }).rows
      : [];
  const payments = rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    if (
      typeof value.payment_id !== "string" ||
      typeof value.payment_status !== "string"
    ) {
      return [];
    }
    const amount = Number(value.payment_amount);
    return [
      {
        paymentId: value.payment_id,
        status: value.payment_status,
        amount: Number.isFinite(amount) ? amount : 0,
        raw: row,
      },
    ];
  });
  const paidRows = payments.filter((payment) => payment.status === "PAID");
  const paidAmount = paidRows.reduce((sum, payment) => sum + payment.amount, 0);

  return { paid: paidRows.length > 0, paidAmount, payments, raw: body };
}

export async function cancelInvoice(qpayInvoiceId: string): Promise<void> {
  await qpayRequest(`/v2/invoice/${encodeURIComponent(qpayInvoiceId)}`, {
    method: "DELETE",
  });
}
