import type { NextRequest } from "next/server";
import { Buffer } from "node:buffer";
import { auth } from "@/app/(auth)/auth";
import { logger, serializeError } from "@/lib/logger";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type TransactionType = "income" | "expense";
type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

// Per line-item draft — one entry per itemized row on the receipt so the
// user can review/edit each line individually before saving.
type FinanceDraft = {
  date: string; // yyyy-mm-dd
  itemName: string; // барааны нэр
  quantity: number; // тоо ширхэг
  unitPrice: number; // нэгж үнэ
  amount: number; // нийт үнэ (quantity * unitPrice эсвэл баримт дээрх нийт дүн)
  type: TransactionType; // income | expense
  category: CategoryId; // ангилал
  note: string; // тайлбар (backward-compat алиас — itemName-тэй ижил)
};

type FinanceResponse = {
  list: FinanceDraft[];
};

function stripCodeFences(text: string): string {
  // Strip ```json ... ``` or ``` ... ``` wrappers the model sometimes adds
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(stripCodeFences(text)) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth guard — AI/OpenAI cost endpoint must be authenticated to prevent abuse.
    const session = await auth();
    if (!session?.user?.id) {
      await logger.warn("finance_analyze_unauthorized", {
        ua: req.headers.get("user-agent"),
      });
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!OPENAI_API_KEY) {
      await logger.error("finance_analyze_missing_openai_key", {});
      return new Response(JSON.stringify({ error: "missing_openai_key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      await logger.warn("finance_analyze_file_not_found", {
        userId: session.user.id,
      });
      return new Response(JSON.stringify({ error: "file_not_found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mime = (file as File).type || "application/octet-stream";
    logger.info("finance_analyze_started", {
      userId: session.user.id,
      mime,
      sizeKb: Math.round(file.size / 1024),
      ua: req.headers.get("user-agent"),
    });

    // (Одоохондоо audio-г дэмжихгүй гэж буцаая — UI-д upload allow байгаа ч server талд тодорхой болгоё)
    if (mime.startsWith("audio/")) {
      return new Response(
        JSON.stringify({ error: "audio_not_supported_yet" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // image -> dataUrl
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    const prompt =
      "Та санхүүгийн баримт (receipt) уншаад баримт дээрх МӨР БҮРИЙГ (line item) тусад нь " +
      "жагсаалт болгож JSON гарга. Баримт дээр олон бараа байвал тэр бүрийг тусдаа мөр болгож гарга.\n" +
      "Зөвхөн дараах structure-тэй JSON буцаа:\n\n" +
      "{\n" +
      `  "list": [\n` +
      "    {\n" +
      `      "date": "2025-12-07",\n` +
      `      "itemName": "Сүү 1л",\n` +
      `      "quantity": 2,\n` +
      `      "unitPrice": 2700,\n` +
      `      "amount": 5400,\n` +
      `      "type": "expense",\n` +
      `      "category": "food"\n` +
      "    }\n" +
      "  ]\n" +
      "}\n\n" +
      "✦ date нь yyyy-mm-dd форматтай, баримт дээрх огноо (олдохгүй бол өнөөдрийн огноо) байг.\n" +
      "✦ itemName дээр тухайн мөрийн барааны нэрийг бич.\n" +
      "✦ quantity нь тоо ширхэг (баримт дээр заагаагүй бол 1).\n" +
      "✦ unitPrice нь нэгж үнэ (баримт дээр зөвхөн нийт дүн байвал amount/quantity-аар тооцож гарга).\n" +
      "✦ amount нь тухайн мөрийн НИЙТ үнэ (quantity * unitPrice).\n" +
      `✦ type нь зөвхөн "income" эсвэл "expense" (ихэнх тохиолдолд "expense").\n` +
      `✦ category нь: "food" | "transport" | "clothes" | "home" | "fun" | "health" | "other".\n` +
      "Зөвхөн цэвэр JSON буцаа, бусад тайлбар өгүүлбэр бүү бич.";

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              // Responses API: image_url is a direct string (not nested {url:...})
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      await logger.error("finance_analyze_openai_failed", {
        status: openaiRes.status,
        detail: detail.slice(0, 2000),
      });
      return new Response(JSON.stringify({ error: "openai_failed", detail }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: any = await openaiRes.json();

    // Responses API: output[0].content[0].text
    const rawText: string = data?.output?.[0]?.content?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "empty_output", raw: data }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const parsed = safeJsonParse<FinanceResponse>(rawText);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "bad_json", raw: rawText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const safeList: FinanceDraft[] = (parsed.list || []).map((item: any) => {
      const quantity = Number(item?.quantity) || 1;
      const rawAmount = Number(item?.amount) || 0;
      const unitPrice =
        Number(item?.unitPrice) || (quantity > 0 ? rawAmount / quantity : 0);
      const amount = rawAmount || unitPrice * quantity;
      const itemName = item?.itemName || item?.note || "";
      return {
        date: item?.date || "",
        itemName,
        quantity,
        unitPrice: Math.round(unitPrice),
        amount: Math.round(amount),
        type: item?.type === "income" ? "income" : "expense",
        category: (item?.category || "other") as CategoryId,
        note: itemName,
      };
    });

    // ✅ Panel чинь payload.drafts гэж уншиж байгаа тул drafts гэж буцаана
    return new Response(JSON.stringify({ drafts: safeList }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    await logger.error("finance_analyze_server_error", {
      error: serializeError(error),
    });
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
