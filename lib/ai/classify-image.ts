import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import {
  IMAGE_CLASSIFIER_MODEL,
  openAIImageDetailOptions,
  openAIReasoningOptions,
} from "./image-models";

export type ImageKind = "receipt" | "food" | "other";

const classifySchema = z.object({
  kind: z.enum(["receipt", "food", "other"]),
});

/**
 * Classifies a chat image attachment so the assistant can route to the right
 * response (finance receipt parsing vs. food nutrition analysis) instead of
 * assuming every uploaded image is a purchase receipt.
 */
export async function classifyChatImage(imageUrl: string): Promise<ImageKind> {
  const { object } = await generateObject({
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
  return object.kind;
}
