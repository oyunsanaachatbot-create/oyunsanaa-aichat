"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";
import {
  recordAppEvent,
  safeErrorMessage,
  usageEventFields,
} from "@/lib/observability/app-events";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
  context,
}: {
  message: UIMessage;
  context?: { userId?: string; chatId?: string; requestId?: string };
}) {
  const startedAt = Date.now();
  try {
    const { text: title, usage, finishReason } = await generateText({
      // ✅ type mismatch-ийг түр тойруулж compile гаргана
      model: getTitleModel() as any,
      system: titlePrompt,
      prompt: getTextFromMessage(message),
    });
    await recordAppEvent({
      level: "info",
      event: "chat_title_completed",
      source: "chat_title",
      route: "/api/chat",
      requestId: context?.requestId,
      userId: context?.userId,
      chatId: context?.chatId,
      model: "gpt-4o-mini",
      historyCount: 1,
      imageCount: 0,
      durationMs: Date.now() - startedAt,
      ...usageEventFields(usage),
      metadata: { finishReason },
    });
    return title;
  } catch (error) {
    await recordAppEvent({
      level: "error",
      event: "chat_title_failed",
      source: "chat_title",
      route: "/api/chat",
      requestId: context?.requestId,
      userId: context?.userId,
      chatId: context?.chatId,
      model: "gpt-4o-mini",
      errorCode: "model_error",
      message: safeErrorMessage(error),
      durationMs: Date.now() - startedAt,
    });
    throw error;
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const message = await getMessageById({ id });

  // message олдохгүй бол шууд stop
  if (!message) return;

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}


export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
