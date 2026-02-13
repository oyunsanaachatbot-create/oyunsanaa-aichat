import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  // ✅ text part байвал л хамгийн багадаа 1 тэмдэгт (харин client text байхгүй үед text part огт нэмэхгүй болсон)
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  // ✅ image mime-үүд
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  name: z.string().min(1).max(200),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

// ✅ user мессеж: parts хамгийн багадаа 1 (file-only байж болно)
const strictUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partSchema).min(1),
});

// ✅ бусад role-уудыг permissive авч үлдээнэ (tool/assistant/system)
const looseNonUserMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["assistant", "system", "tool"]),
  parts: z.array(z.any()).default([]),
});

const messageSchema = z.union([strictUserMessageSchema, looseNonUserMessageSchema]);

export const postRequestBodySchema = z.object({
  id: z.string(),
  // template: нэг мессеж эсвэл бүх messages
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),

  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]).optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
