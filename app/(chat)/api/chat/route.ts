import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
} from "ai";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";

import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({ waitUntil: after });
    } catch (error: any) {
      if (error?.message?.includes("REDIS_URL")) {
        console.log(" > Resumable streams are disabled due to missing REDIS_URL");
      } else {
        console.error(error);
      }
    }
  }
  return globalStreamContext;
}

function safeUserType(raw: unknown): UserType {
  const t = typeof raw === "string" ? raw : "guest";
  return (t in entitlementsByUserType ? t : "guest") as UserType;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    requestBody = postRequestBodySchema.parse(await request.json());
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // ✅ Tool approval flow зөв тодорхойлолт:
    // зөвхөн client-ээс бүх messages[] явуулсан үед.
    const isToolApprovalFlow = Array.isArray(messages) && messages.length > 0;

    // ✅ Normal flow-д message заавал байх ёстой
    if (!isToolApprovalFlow && !message) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const userType = safeUserType(session.user.type);
    const entitlements = entitlementsByUserType[userType];

    // ✅ Rate-limit DB query унасан ч chat-г унагахгүй
    try {
      const messageCount = await getMessageCountByUserId({
        id: session.user.id,
        differenceInHours: 24,
      });

      if (messageCount > entitlements.maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }
    } catch (e) {
      console.error("getMessageCountByUserId failed (non-fatal):", e);
    }

    // ✅ DB-ээс чат/мессеж унших: унасан ч үргэлжилнэ
    let chat: any = null;
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    try {
      chat = await getChatById({ id });

      if (chat) {
        if (chat.userId !== session.user.id) {
          return new ChatSDKError("forbidden:chat").toResponse();
        }

        if (!isToolApprovalFlow) {
          messagesFromDb = await getMessagesByChatId({ id });
        }
      } else if (message?.role === "user") {
        // Chat үүсгэх: унасан ч chat streaming-г үргэлжлүүлнэ
        try {
          await saveChat({
            id,
            userId: session.user.id,
            title: "New chat",
            visibility: selectedVisibilityType,
          });
        } catch (e) {
          console.error("saveChat failed (non-fatal):", e);
        }

        titlePromise = generateTitleFromUserMessage({ message });
      }
    } catch (e) {
      console.error("getChat/getMessages failed (non-fatal):", e);
    }

    const uiMessages: ChatMessage[] = (
      isToolApprovalFlow
        ? (messages as ChatMessage[])
        : [...convertToUIMessages(messagesFromDb), message as ChatMessage]
    ).filter(Boolean) as ChatMessage[];

    if (uiMessages.length === 0) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };

    // ✅ User message хадгалах: унасан ч үргэлжилнэ
    if (message?.role === "user") {
      try {
        await saveMessages({
          messages: [
            {
              chatId: id,
              id: message.id,
              role: "user",
              parts: message.parts,
              attachments: [],
              createdAt: new Date(),
            },
          ],
        });
      } catch (e) {
        console.error("saveMessages(user) failed (non-fatal):", e);
      }
    }

    // ✅ Resumable stream id: унасан ч үргэлжилнэ
    const streamId = generateUUID();
    try {
      await createStreamId({ streamId, chatId: id });
    } catch (e) {
      console.error("createStreamId failed (non-fatal):", e);
    }

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,

      execute: async ({ writer: dataStream }) => {
        if (titlePromise) {
          titlePromise
            .then((title) => {
              try {
                updateChatTitleById({ chatId: id, title });
              } catch {}
              dataStream.write({ type: "data-chat-title", data: title });
            })
            .catch(() => {});
        }

        const selected = selectedChatModel ?? "openai/gpt-4.1";
        const isReasoningModel =
          selected.includes("reasoning") || selected.includes("thinking");

        const result = streamText({
          model: getLanguageModel(selected),
          system: systemPrompt({ selectedChatModel: selected, requestHints }),
          messages: await convertToModelMessages(uiMessages),

          // ✅ Энд түр “stopWhen: stepCountIs(5)” битгий тавь — хариуг тасалчихдаг.
          // stopWhen: stepCountIs(5),

          experimental_activeTools: isReasoningModel
            ? []
            : ["getWeather", "createDocument", "updateDocument", "requestSuggestions"],

          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
          },

          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        // Stream эхлүүлнэ
        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },

      generateId: generateUUID,

      onFinish: async ({ messages: finishedMessages }) => {
        // ✅ DB save хэсэг унасан ч chat аль хэдийн user дээр харагдчихсан байна.
        try {
          if (isToolApprovalFlow) {
            for (const finishedMsg of finishedMessages) {
              const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
              if (existingMsg) {
                await updateMessage({
                  id: finishedMsg.id,
                  parts: finishedMsg.parts,
                });
              } else {
                await saveMessages({
                  messages: [
                    {
                      id: finishedMsg.id,
                      role: finishedMsg.role,
                      parts: finishedMsg.parts,
                      createdAt: new Date(),
                      attachments: [],
                      chatId: id,
                    },
                  ],
                });
              }
            }
          } else if (finishedMessages.length > 0) {
            await saveMessages({
              messages: finishedMessages.map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              })),
            });
          }
        } catch (e) {
          console.error("onFinish save failed (non-fatal):", e);
        }
      },

      onError: () => "Oops, an error occurred!",
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      try {
        const resumableStream = await streamContext.resumableStream(
          streamId,
          () => stream.pipeThrough(new JsonToSseTransformStream())
        );
        if (resumableStream) return new Response(resumableStream);
      } catch (e) {
        console.error("Failed to create resumable stream:", e);
      }
    }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) return error.toResponse();

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new ChatSDKError("bad_request:api").toResponse();

  const session = await auth();
  if (!session?.user) return new ChatSDKError("unauthorized:chat").toResponse();

  const chat = await getChatById({ id });
  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
