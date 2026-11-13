import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  name: z.string().min(1).max(100),
  // Must point at our own /api/uploads/ path — the server fetches this URL
  // server-side (lib/ai/resolve-image-attachments.ts), so an unrestricted
  // URL here is an SSRF primitive into internal addresses. This is a cheap
  // early rejection; the real origin check happens at fetch time.
  url: z.string().url().refine(
    (u) => {
      try {
        return new URL(u).pathname.startsWith("/api/uploads/");
      } catch {
        return false;
      }
    },
    { message: "url must point at /api/uploads/" }
  ),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

// For tool approval flows, we accept all messages (more permissive schema)
const messageSchema = z.object({
  id: z.string(),
  role: z.string(),
  parts: z.array(z.any()),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  // Either a single new message or all messages (for tool approvals)
  message: userMessageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
