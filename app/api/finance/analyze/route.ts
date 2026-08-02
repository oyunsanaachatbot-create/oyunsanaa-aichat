import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  openAIImageDetailOptions,
  openAIReasoningOptions,
  shouldUseReceiptFallback,
  RECEIPT_FALLBACK_MODEL,
  RECEIPT_PRIMARY_MODEL,
} from "@/lib/ai/image-models";
import { logger, serializeError } from "@/lib/logger";
import { normalizeUploadedImage } from "@/lib/uploads/normalize-image";

export const runtime = "nodejs";
export const maxDuration = 60;

type TransactionType = "income" | "expense";
type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

type FinanceDraft = {
  date: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  note: string;
};

const categorySchema = z.enum([
  "food",
  "transport",
  "clothes",
  "home",
  "fun",
  "health",
  "other",
]);

const receiptSchema = z.object({
  confidence: z.number().min(0).max(1),
  list: z.array(
    z.object({
      date: z.string(),
      itemName: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      amount: z.number(),
      type: z.enum(["income", "expense"]),
      category: categorySchema,
    })
  ),
});

const prompt = `Та санхүүгийн баримтын зураг уншаад баримт дээрх мөр бүрийг тусдаа list item болгон гарга.
date нь YYYY-MM-DD; огноо харагдахгүй бол өнөөдрийн огноо байна.
quantity харагдахгүй бол 1. unitPrice нь нэгж үнэ, amount нь тухайн мөрийн нийт үнэ байна.
type нь income эсвэл expense; category нь food, transport, clothes, home, fun, health, other-ын нэг байна.
confidence нь зураг болон бүх мөрийг зөв уншсан нийт итгэлцлийг 0-1 хооронд илэрхийлнэ. Бүдгэрсэн, тасарсан эсвэл эргэлзээтэй тэмдэгт байвал бууруул.`;

async function analyzeReceipt(
  imageBytes: Uint8Array,
  model: string,
  reasoningEffort: "minimal" | "low"
) {
  const { object } = await generateObject({
    model: openai(model),
    schema: receiptSchema,
    providerOptions: openAIReasoningOptions(reasoningEffort),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image",
            image: imageBytes,
            mediaType: "image/jpeg",
            providerOptions: openAIImageDetailOptions("high"),
          },
        ],
      },
    ],
  });
  return object;
}

function toSafeDrafts(list: z.infer<typeof receiptSchema>["list"]): FinanceDraft[] {
  return list.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const rawAmount = Number(item.amount) || 0;
    const unitPrice =
      Number(item.unitPrice) || (quantity > 0 ? rawAmount / quantity : 0);
    const amount = rawAmount || unitPrice * quantity;
    return {
      date: item.date || "",
      itemName: item.itemName || "",
      quantity,
      unitPrice: Math.round(unitPrice),
      amount: Math.round(amount),
      type: item.type === "income" ? "income" : "expense",
      category: item.category,
      note: item.itemName || "",
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      await logger.warn("finance_analyze_unauthorized", {
        ua: req.headers.get("user-agent"),
      });
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!process.env.OPENAI_API_KEY) {
      await logger.error("finance_analyze_missing_openai_key", {});
      return Response.json({ error: "missing_openai_key" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return Response.json({ error: "file_not_found" }, { status: 400 });
    }
    if (file.type.startsWith("audio/")) {
      return Response.json({ error: "audio_not_supported_yet" }, { status: 400 });
    }

    logger.info("finance_analyze_started", {
      userId: session.user.id,
      mime: file.type || "application/octet-stream",
      sizeKb: Math.round(file.size / 1024),
      ua: req.headers.get("user-agent"),
    });

    let normalizedFile: Blob;
    try {
      normalizedFile = await normalizeUploadedImage(file, { forceJpeg: true });
    } catch (error) {
      await logger.warn("finance_analyze_invalid_image", {
        userId: session.user.id,
        error: serializeError(error),
      });
      return Response.json({ error: "invalid_image" }, { status: 400 });
    }
    const imageBytes = new Uint8Array(await normalizedFile.arrayBuffer());

    let result: z.infer<typeof receiptSchema>;
    let usedModel = RECEIPT_PRIMARY_MODEL;
    try {
      result = await analyzeReceipt(
        imageBytes,
        RECEIPT_PRIMARY_MODEL,
        "minimal"
      );
      if (shouldUseReceiptFallback(result.confidence, result.list.length)) {
        usedModel = RECEIPT_FALLBACK_MODEL;
        result = await analyzeReceipt(imageBytes, RECEIPT_FALLBACK_MODEL, "low");
      }
    } catch (primaryError) {
      await logger.warn("finance_analyze_primary_failed", {
        model: RECEIPT_PRIMARY_MODEL,
        error: serializeError(primaryError),
      });
      usedModel = RECEIPT_FALLBACK_MODEL;
      result = await analyzeReceipt(imageBytes, RECEIPT_FALLBACK_MODEL, "low");
    }

    logger.info("finance_analyze_completed", {
      userId: session.user.id,
      model: usedModel,
      confidence: result.confidence,
      itemCount: result.list.length,
    });

    return Response.json({
      drafts: toSafeDrafts(result.list),
      confidence: result.confidence,
    });
  } catch (error) {
    await logger.error("finance_analyze_server_error", {
      error: serializeError(error),
    });
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
