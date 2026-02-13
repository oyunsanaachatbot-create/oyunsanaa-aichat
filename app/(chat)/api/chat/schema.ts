import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  // ✅ ЗӨВ MIME: image/jpeg (image/jpg биш)
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partsSchema = z.union([textPartSchema, filePartSchema]);

// ✅ user message: дор хаяж 1 part байх ёстой (text байж болно, file байж болно)
const strictUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partsSchema).min(1),
});

// ✅ бусад role-уудыг сул зөвшөөрнө (AI SDK tool parts гэх мэт)
const looseNonUserMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["assistant", "system", "tool"]),
  parts: z.array(z.any()).default([]),
});

const messageSchema = z.union([strictUserMessageSchema, looseNonUserMessageSchema]);

export const postRequestBodySchema = z.object({
  id: z.string(),
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.string().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
