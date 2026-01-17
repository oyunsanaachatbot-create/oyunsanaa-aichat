import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
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
  ensureUserIdByEmail,
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
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message?.includes("REDIS_URL")) {
        console.log(" > Resumable streams are disabled due to missing REDIS_URL");
      } else {
        console.error(error);
      }
    }
  }
  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    // 1) Auth
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // 2) Ensure DB user exists (DB uuid-г нэг л удаа авна)
    const dbUserId = await ensureUserIdByEmail(email);

    // 3) Session-ийг tools/queries-д таарахуйц болгоно (id = db uuid, type fallback)
    const userType = ((session.user as any)?.type ?? "regular") as UserType;

    const fixedSession = {
      ...session,
      user: {
        ...session.user,
        id: dbUserId,
        type: userType,
      },
    };

    // 4) Rate limit (db uuid ашиглана)
    const limits =
      entitlementsByUserType[userType] ?? entitlementsByUserType["regular"];

    const messageCount = await getMessageCountByUserId({
      id: dbUserId,
      differenceInHours: 24,
    });

    if (messageCount > limits.maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    // 5) Tool approval flow?
    const isToolApprovalFlow = Boolean(messages);

    // 6) Chat load / ownership check (chat нэг л удаа)
    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== dbUserId) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      // First time chat create
      await saveChat({
        id,
        userId: dbUserId,
        title: "New chat",
        visibility: selectedVisibilityType,
      });

      titlePromise = generateTitleFromUserMessage({ message });
    }

    // 7) Build UI messages
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    // 8) Request hints (geo)
    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };

    // 9) Save ONLY user message
    if (message?.role === "user") {
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
    }

    // 10) Create stream id
    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // 11) Stream response
    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        if (titlePromise) {
          titlePromise.then((title) => {
            updateChatTitleById({ chatId: id, title });
            dataStream.write({ type: "data-chat-title", data: title });
          });
        }

        const isReasoningModel =
          selectedChatModel.includes("reasoning") ||
          selectedChatModel.includes("thinking");

        const result = streamText({
          model: getLanguageModel(selectedChatModel) as any,
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: await convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),

          experimental_activeTools: isReasoningModel
            ? []
            : [
                "getWeather",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
              ],

          experimental_transform: smoothStream({ chunking: "word" }),

          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : undefined,

          tools: {
            getWeather,
            createDocument: createDocument({
              session: fixedSession as any,
              dataStream,
            }),
            updateDocument: updateDocument({
              session: fixedSession as any,
              dataStream,
            }),
            requestSuggestions: requestSuggestions({
              session: fixedSession as any,
              dataStream,
            }),
          },

          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
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
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      try {
        const resumableStream = await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream())
        );
        if (resumableStream) {
          return new Response(resumableStream);
        }
      } catch (error) {
        console.error("Failed to create resumable stream:", error);
      }
    }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

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

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const dbUserId = await ensureUserIdByEmail(email);

  const chat = await getChatById({ id });
  if (!chat) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  if (chat.userId !== dbUserId) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
