// app/(chat)/api/chat/schema.ts
import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  // template дээр image/jpeg, image/png байдаг — webp ашиглаж байвал нэм
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

// Tool approval/assistant/system гэх мэт бусад message-үүдийг permissive байлгая
const messageSchema = z.union([
  userMessageSchema,
  z.object({
    id: z.string(),
    role: z.string(),
    parts: z.array(z.any()),
  }),
]);

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  // Either a single new message or all messages (for tool approvals)
  message: userMessageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
