import "server-only";

import type { LanguageModelUsage } from "ai";
import { insertAppEvent } from "@/lib/db/queries";

const SECRET_RE = /(bearer\s+|sk-)[a-z0-9._-]+/gi;

export type AppEventInput = {
  level: "info" | "warn" | "error";
  event: string;
  source: string;
  route?: string;
  requestId?: string;
  userId?: string | null;
  chatId?: string | null;
  model?: string;
  statusCode?: number;
  errorCode?: string;
  message?: string;
  inputTokens?: number;
  cachedInputTokens?: number;
  cacheWriteTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  historyCount?: number;
  imageCount?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export function safeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(SECRET_RE, "$1[redacted]").slice(0, 500);
}

export function usageEventFields(usage: LanguageModelUsage) {
  return {
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.inputTokenDetails.cacheReadTokens,
    cacheWriteTokens: usage.inputTokenDetails.cacheWriteTokens,
    outputTokens: usage.outputTokens,
    reasoningTokens: usage.outputTokenDetails.reasoningTokens,
    totalTokens: usage.totalTokens,
  };
}

export async function recordAppEvent(input: AppEventInput): Promise<void> {
  try {
    await insertAppEvent({
      ...input,
      userId: input.userId || null,
      chatId: input.chatId || null,
      message: input.message?.slice(0, 500),
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    // Observability must never break the user request it is observing.
    console.error("[observability] failed to persist event", {
      event: input.event,
      error: safeErrorMessage(error),
    });
  }
}
