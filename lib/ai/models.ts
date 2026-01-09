// Curated list of top models from Vercel AI Gateway
export const DEFAULT_CHAT_MODEL = "openai/gpt-4.1";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "openai/gpt-4.1",
    name: "Сэтгэлзүйн яриа",
    provider: "openai",
    description: "Үндсэн яриа, хамгийн чанартай",
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "Зураг, баримт унших",
    provider: "openai",
    description: "Хурдан, хямд, уншилт/танилт",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "Төсөл танилцуулга",
    provider: "openai",
    description: "Хурдан, сайн бүтэцтэй танилцуулга",
  },
];


// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
