import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.string().refine((v) => v.startsWith("image/"), "mediaType must be image/*"),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partsSchema = z.union([textPartSchema, filePartSchema]);

const strictUserMessageSchema = z.object({
  id: z.string(),
  role: z.literal("user"),
  parts: z.array(partsSchema).min(1),
});

// бусад role-уудыг permissive
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
