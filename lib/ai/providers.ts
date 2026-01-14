import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

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

function resolveOpenAI(modelId: string) {
  const trimmed = modelId.replace(THINKING_SUFFIX_REGEX, "");
  // "openai/gpt-4.1-mini" гэх мэт prefix байвал авч хаяна
  const actual = trimmed.startsWith("openai/") ? trimmed.slice(7) : trimmed;
  return openai(actual);
}

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    return wrapLanguageModel({
      model: resolveOpenAI(modelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return resolveOpenAI(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  // хүсвэл өөр model болгож өөрчилж болно
  return resolveOpenAI("gpt-4.1-mini");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  // хүсвэл өөр model болгож өөрчилж болно
  return resolveOpenAI("gpt-4.1-mini");
}
