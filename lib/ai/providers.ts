import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { chatModels, DEFAULT_CHAT_MODEL } from "./models";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Strip "openai/" prefix from gateway-style model IDs like "openai/gpt-4o"
function toOpenAIModelId(modelId: string): string {
  return modelId.startsWith("openai/") ? modelId.slice("openai/".length) : modelId;
}

// Allowed final OpenAI ids (derived from the UI model list)
const ALLOWED_OPENAI_IDS = new Set(
  chatModels.map((m) => toOpenAIModelId(m.id))
);

// Map any incoming model id to a valid OpenAI id.
// Stale cookies / old gateway ids (e.g. "chat-model", "anthropic/...") fall back
// to the default so they don't crash the stream with model_not_found.
function resolveOpenAIModelId(modelId: string): string {
  const cleanId = toOpenAIModelId(modelId.replace(THINKING_SUFFIX_REGEX, ""));
  if (ALLOWED_OPENAI_IDS.has(cleanId)) return cleanId;
  return toOpenAIModelId(DEFAULT_CHAT_MODEL);
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
    return myProvider.languageModel(modelId) as any;
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  const cleanId = resolveOpenAIModelId(modelId);

  if (isReasoningModel) {
    return wrapLanguageModel({
      model: openai(cleanId) as any,
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    }) as any;
  }

  return openai(cleanId) as any;
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model") as any;
  }

  return openai("gpt-4o-mini") as any;
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model") as any;
  }

  return openai("gpt-4o-mini") as any;
}
