import { z } from "zod";

/**
 * TEXT PART
 * text хоосон байж болно (зураг дангаар явуулах үед)
 */
const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(2000),
});

/**
 * FILE PART
 * image/jpeg, image/png, image/webp дэмжинэ
 */
const filePartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  name: z.string().max(200),
  url: z.string().url(),
});

/**
 * PART (text эсвэл file)
 */
const partSchema = z.union([textPartSchema, filePartSchema]);

/**
 * USER MESSAGE
 * дор хаяж 1 part байх ёстой
 */
const strictUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partSchema).min(1),
});

/**
 * ASSISTANT / SYSTEM / TOOL
 */
const looseNonUserMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["assistant", "system", "tool"]),
  parts: z.array(z.any()).default([]),
});

/**
 * MESSAGE
 */
const messageSchema = z.union([
  strictUserMessageSchema,
  looseNonUserMessageSchema,
]);

/**
 * REQUEST BODY
 */
export const postRequestBodySchema = z.object({
  id: z.string(),
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.string().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
