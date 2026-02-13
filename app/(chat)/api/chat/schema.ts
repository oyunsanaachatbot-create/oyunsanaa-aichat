import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partsSchema = z.union([textPartSchema, filePartSchema]);

// ✅ User message: parts нь дор хаяж 1 байна (text эсвэл file байж болно)
const strictUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partsSchema).min(1),
});

// ✅ Non-user: tool parts янз бүр байж болно → permissive
const looseNonUserMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["assistant", "system", "tool"]),
  parts: z.array(z.any()).default([]),
});

const messageSchema = z.union([strictUserMessageSchema, looseNonUserMessageSchema]);

export const postRequestBodySchema = z.object({
  id: z.string(),
  // ✅ аль алиг нь зөвшөөрнө
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.string().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
