import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  // ✅ хамгийн чухал нь: image/jpeg зөвшөөрөх
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/jpg"]).optional(),
  name: z.string().min(1).max(100).optional(),
  url: z.string().url(),
});

const partsSchema = z.union([textPartSchema, filePartSchema]);

// ✅ USER message = strict (parts нь partsSchema байх ёстой, хамгийн багадаа 1 part)
const strictUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partsSchema).min(1),
});

// ✅ assistant/system/tool = loose (энэ хэсгийг хатуу шалгах хэрэггүй)
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
