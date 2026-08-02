import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import {
  IMAGE_CLASSIFIER_MODEL,
  openAIImageDetailOptions,
  openAIReasoningOptions,
} from "./image-models";
import {
  recordAppEvent,
  usageEventFields,
} from "@/lib/observability/app-events";

export type ImageKind = "receipt" | "food" | "other";

const classifySchema = z.object({
  kind: z.enum(["receipt", "food", "other"]),
});

/**
 * Classifies a chat image attachment so the assistant can route to the right
 * response (finance receipt parsing vs. food nutrition analysis) instead of
 * assuming every uploaded image is a purchase receipt.
 */
export async function classifyChatImage(
  imageUrl: string,
  context?: { userId?: string; chatId?: string; requestId?: string }
): Promise<ImageKind> {
  const startedAt = Date.now();
  const { object, usage, finishReason } = await generateObject({
    model: openai(IMAGE_CLASSIFIER_MODEL),
    schema: classifySchema,
    providerOptions: openAIReasoningOptions("none"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Энэ зураг юуг илэрхийлж байна вэ? Хэрэв дэлгүүр/рестораны төлбөрийн баримт (receipt) бол "receipt", хоол/хүнсний зураг бол "food", бусад бол "other" гэж хариул.',
          },
          {
            type: "image",
            image: imageUrl,
            providerOptions: openAIImageDetailOptions("low"),
          },
        ],
      },
    ],
  });
  await recordAppEvent({
    level: "info",
    event: "image_classification_completed",
    source: "image_classifier",
    route: "/api/chat",
    model: IMAGE_CLASSIFIER_MODEL,
    userId: context?.userId,
    chatId: context?.chatId,
    requestId: context?.requestId,
    imageCount: 1,
    historyCount: 1,
    durationMs: Date.now() - startedAt,
    ...usageEventFields(usage),
    metadata: { kind: object.kind, finishReason },
  });
  return object.kind;
}
