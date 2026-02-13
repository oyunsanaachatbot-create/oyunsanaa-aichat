import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

// app/api/chat/schema.ts (эсвэл байгаа schema файл)
// parts-ийг хатуу шалгахын оронд permissive болго
const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  parts: z.array(z.any()).default([]), // ✅ энд л гол өөрчлөлт
});

export const postRequestBodySchema = z.object({
  id: z.string(),
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.string().optional(),
});


export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
