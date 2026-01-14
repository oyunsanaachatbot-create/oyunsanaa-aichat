import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

const THINKING_SUFFIX_REGEX = /-thinking$/;

/**
 * Convert "openai/gpt-4.1" -> { provider: "openai", model: "gpt-4.1" }
 * Convert "gpt-4.1"      -> { provider: "openai", model: "gpt-4.1" }  (default provider)
 */
function parseModelId(modelId: string): { provider: string; model: string } {
  const trimmed = modelId.replace(THINKING_SUFFIX_REGEX, "");

  const slashIndex = trimmed.indexOf("/");
  if (slashIndex === -1) {
    // No prefix -> assume OpenAI by default (you can change this default if you want)
    return { provider: "openai", model: trimmed };
  }

  const provider = trimmed.slice(0, slashIndex);
  const model = trimmed.slice(slashIndex + 1);
  return { provider, model };
}

/**
 * Returns a direct provider model instance (NO gateway).
 */
function resolveDirectModel(modelId: string) {
  const { provider, model } = parseModelId(modelId);

  switch (provider) {
    case "openai":
      return openai(model);
    case "anthropic":
      return anthropic(model);
    default:
      // If you have other providers later, add them here.
      // For now fail loudly so you immediately see what's still using gateway-like ids.
      throw new Error(
        `Unsupported provider prefix "${provider}" in modelId "${modelId}". ` +
          `Supported: openai/*, anthropic/*`
      );
  }
}

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    // Keep your reasoning middleware behavior, but use DIRECT model (no gateway)
    const directModel = resolveDirectModel(modelId);

    return wrapLanguageModel({
      model: directModel,
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  // Normal chat model, DIRECT (no gateway)
  return resolveDirectModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  // DIRECT model (no gateway). You can change this to whatever you want.
  return anthropic("claude-haiku-4.5");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }

  // DIRECT model (no gateway). You can change this to whatever you want.
  return anthropic("claude-haiku-4.5");
}
