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
import { cookies } from "next/headers";

import {
  createStreamId,
  deleteChatById,
  ensureUserIdByEmail,
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
    requestBody = postRequestBodySchema.parse(await request.json());
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

  // 1) Auth
const session = await auth();
if (!session?.user) return new ChatSDKError("unauthorized:chat").toResponse();

const isGuest = (session.user.type ?? "regular") === "guest";

// ✅ Guest limit: DB ашиглахгүй, cookie дээр өдөрт X
if (isGuest && message?.role === "user") {
  const LIMIT = 10; // хүсвэл 5 болго
  const store = cookies(); // ✅ await БИШ

  const key = "guest_msg_count_v1";
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // cookie формат: "YYYY-MM-DD:count"
  const raw = store.get(key)?.value ?? "";
  const [savedDay, savedCountStr] = raw.split(":");
  const savedCount = Number(savedCountStr ?? "0");

  const countToday = savedDay === today ? savedCount : 0;

  if (countToday >= LIMIT) {
    return new ChatSDKError("rate_limit:chat").toResponse();
  }

  store.set(key, `${today}:${countToday + 1}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 өдөр
  });
}

// 2) Regular user үед email хэрэгтэй, DB user ensure хийнэ.
// Guest үед DB-д шинэ user үүсгэхгүй!
let fixedSession = session;
let userType: UserType = (session.user.type ?? "regular") as UserType;

if (!isGuest) {
  if (!session.user.email) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const dbUserId = await ensureUserIdByEmail(session.user.email);

  fixedSession = {
    ...session,
    user: { ...session.user, id: dbUserId, type: "regular" },
  };

  userType = "regular";
}

// 3) Rate limit (Regular дээр DB-р, Guest дээр cookie-р already хязгаарласан)
if (!isGuest) {
  const messageCount = await getMessageCountByUserId({
    id: fixedSession.user.id,
    differenceInHours: 24,
  });

  const limits =
    entitlementsByUserType[userType] ?? entitlementsByUserType["regular"];

  if (messageCount > limits.maxMessagesPerDay) {
    return new ChatSDKError("rate_limit:chat").toResponse();
  }
}

// 4) Tool approval flow?
const isToolApprovalFlow = Boolean(messages);


    // 5) Chat load / ownership (✅ Guest үед DB-ээс юу ч уншихгүй)
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (!isGuest) {
      const existingChat = await getChatById({ id });

      if (existingChat) {
        if (existingChat.userId !== fixedSession.user.id) {
          return new ChatSDKError("forbidden:chat").toResponse();
        }
        if (!isToolApprovalFlow) {
          messagesFromDb = await getMessagesByChatId({ id });
        }
      } else if (message?.role === "user") {
        await saveChat({
          id,
          userId: fixedSession.user.id,
          title: "New chat",
          visibility: selectedVisibilityType,
        });
        titlePromise = generateTitleFromUserMessage({ message });
      }
    } else {
      messagesFromDb = [];
      titlePromise = null;
    }

    // 6) Build UI messages
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    // 7) Geo hints
    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };

    // 8) Save ONLY user message (✅ Guest үед хадгалахгүй)
    if (!isGuest && message?.role === "user") {
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

    // 9) Stream id (✅ Guest үед хадгалахгүй)
    const streamId = generateUUID();
    if (!isGuest) {
      await createStreamId({ streamId, chatId: id });
    }

    // 10) Stream response
    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,

      execute: async ({ writer: dataStream }) => {
        if (!isGuest && titlePromise) {
          titlePromise.then((title) => {
            updateChatTitleById({ chatId: id, title });
            dataStream.write({ type: "data-chat-title", data: title });
          });
        }

       // ✅ ACTIVE TOOLS TypeScript алдааг бүрэн зассан хэсэг
const isReasoningModel =
  selectedChatModel.includes("reasoning") ||
  selectedChatModel.includes("thinking");

const result = streamText({
  model: getLanguageModel(selectedChatModel) as any,
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: await convertToModelMessages(uiMessages),
  stopWhen: stepCountIs(5),

  // ✅ Guest эсвэл reasoning үед tool ашиглуулахгүй
  experimental_activeTools:
    (isGuest || isReasoningModel
      ? []
      : ["getWeather", "createDocument", "updateDocument", "requestSuggestions"]) as any,

  experimental_transform: smoothStream({ chunking: "word" }),

  tools: {
    getWeather,
    // ✅ Guest үед tools идэвхгүй тул эдгээр ажиллахгүй (DB бичихгүй)
    createDocument: createDocument({ session: fixedSession, dataStream }),
    updateDocument: updateDocument({ session: fixedSession, dataStream }),
    requestSuggestions: requestSuggestions({ session: fixedSession, dataStream }),
  },

  experimental_telemetry: {
    isEnabled: isProductionEnvironment,
    functionId: "stream-text",
  },
});


        result.consumeStream();
        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
      },

      generateId: generateUUID,

      onFinish: async ({ messages: finishedMessages }) => {
        // ✅ Guest үед DB хадгалалт огт хийхгүй
        if (isGuest) return;

        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existing = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existing) {
              await updateMessage({ id: finishedMsg.id, parts: finishedMsg.parts });
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
      },

      onError: () => "Oops, an error occurred!",
    });

    const streamContext = getStreamContext();

    // ✅ Resumable stream нь ихэвчлэн streamId хадгалалттай уялддаг тул Guest үед ашиглахгүй
    if (streamContext && !isGuest) {
      try {
        const resumableStream = await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream())
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

  const isGuest = (session.user.type ?? "regular") === "guest";
  if (isGuest) {
    // Guest үед DB-д чат байхгүй → delete хийхгүй
    return Response.json({ ok: true, skipped: true }, { status: 200 });
  }

  const chat = await getChatById({ id });
  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
