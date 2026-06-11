import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Strip "openai/" prefix from gateway-style model IDs like "openai/gpt-4o"
function toOpenAIModelId(modelId: string): string {
  return modelId.startsWith("openai/") ? modelId.slice("openai/".length) : modelId;
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

  const cleanId = toOpenAIModelId(modelId.replace(THINKING_SUFFIX_REGEX, ""));

  if (isReasoningModel) {
    return wrapLanguageModel({
      model: openai(cleanId) as any,
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    }) as any;
  }

  return openai(toOpenAIModelId(modelId)) as any;
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
