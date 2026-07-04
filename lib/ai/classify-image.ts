import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

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
    model: openai("gpt-4o-mini"),
    schema: classifySchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Энэ зураг юуг илэрхийлж байна вэ? Хэрэв дэлгүүр/рестораны төлбөрийн баримт (receipt) бол "receipt", хоол/хүнсний зураг бол "food", бусад бол "other" гэж хариул.',
          },
          { type: "image", image: imageUrl },
        ],
      },
    ],
  });
  return object.kind;
}
