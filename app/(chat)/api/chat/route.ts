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

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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

// ✅ TypeScript-д activeTools төрлийг яг зааж өгнө
type ActiveTool =
  | "getWeather"
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions";

/** ✅ Supabase admin client (server) — SAFE init (env байхгүй бол crash хийхгүй) */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // зөвхөн server дээр

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

/** урт текстийг prompt-д хэт их оруулахгүй */
function clampText(text: string, maxChars = 6000) {
  const t = (text ?? "").toString();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + "\n\n…(таслав)";
}

/** ✅ user_settings-с хэрэглэгчийн хамгийн сүүлд уншсан artifact-ийн slug/title/id */
async function getActiveArtifactForUser(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("active_artifact_title, active_artifact_slug, active_artifact_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

/** ✅ kb_articles (37 текст) -ийг slug-аар уншина */
/** ✅ kb_articles (37 текст) -ийг slug-аар уншина (slash зөрүүг зассан) */
async function getKbArticleBySlug(slug: string) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  const clean = (slug ?? "").toString().trim();
  if (!clean) return null;

  try {
    // 1) яг адилхан slug
    const exact = await supabaseAdmin
      .from("kb_articles")
      .select("slug, title, content, category")
      .eq("slug", clean)
      .maybeSingle();
    if (exact.data) return exact.data;

    // 2) урд '/'-гүй хувилбар
    const noSlash = clean.startsWith("/") ? clean.slice(1) : clean;
    const alt = await supabaseAdmin
      .from("kb_articles")
      .select("slug, title, content, category")
      .eq("slug", noSlash)
      .maybeSingle();
    if (alt.data) return alt.data;

    // 3) урд '/' нэмсэн хувилбар
    const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
    const alt2 = await supabaseAdmin
      .from("kb_articles")
      .select("slug, title, content, category")
      .eq("slug", withSlash)
      .maybeSingle();

    return alt2.data ?? null;
  } catch {
    return null;
  }
}


export async function POST(request: Request) {
  const vercelId = request.headers.get("x-vercel-id") ?? undefined;
  let requestBody: PostRequestBody;

  try {
    requestBody = postRequestBodySchema.parse(await request.json());
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;
// ✅ 0) file part ирсэн эсэх + url байгаа эсэхийг шалгана
const checkMsgs = (messages ?? (message ? [message] : [])) as any[];

const hasFileWithoutUrl = checkMsgs.some((m) =>
  Array.isArray(m?.parts) &&
  m.parts.some((p: any) => p?.type === "file" && !p?.url)
);

if (hasFileWithoutUrl) {
  return Response.json(
    {
      code: "file_not_uploaded",
      message:
        "Зураг эхлээд /api/upload-оор upload хийгдээд URL үүссэний дараа /api/chat руу илгээгдэх ёстой.",
    },
    { status: 400 }
  );
}
    // 1) Auth
    const session = await auth();
    if (!session?.user) return new ChatSDKError("unauthorized:chat").toResponse();

    const isGuest = (session.user.type ?? "regular") === "guest";

    // ✅ Guest LIMIT (cookie дээр) — DB ашиглахгүй
    if (isGuest && message?.role === "user") {
      const LIMIT = 10;
      const store = await cookies();

      const key = "guest_msg_count_v1";
      const today = new Date().toISOString().slice(0, 10);

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
        secure: isProductionEnvironment,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // 2) Regular үед DB user ensure (Guest үед хийхгүй)
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

    // ✅ Active artifact + KB content context (Regular user үед л)
    const active = !isGuest
      ? await getActiveArtifactForUser(fixedSession.user.id)
      : null;

    const kb =
      !isGuest && active?.active_artifact_slug
        ? await getKbArticleBySlug(active.active_artifact_slug)
        : null;

    // ✅ Гар утсан дээр “гарчиг таних” чинь эндээс явна (title+content хоёулаа орно)
    const activeContext =
      active?.active_artifact_title || kb?.title
        ? `
[USER CURRENTLY READING]
Title: ${kb?.title ?? active?.active_artifact_title ?? ""}
Slug: ${kb?.slug ?? active?.active_artifact_slug ?? ""}
Id: ${active?.active_artifact_id ?? ""}

[ARTICLE CONTENT]
${kb?.content ? clampText(String(kb.content), 6000) : ""}

INSTRUCTION:
- Answer using the ARTICLE CONTENT above first.
- If the user asks something unrelated, ask a short clarifying question.
`
        : "";

    // 3) Rate limit (Regular дээр DB-р)
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

    // 5) Chat load / ownership (✅ Guest үед DB-ээс огт уншихгүй)
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
  const userMessage = message as ChatMessage;

  await saveChat({
    id,
    userId: fixedSession.user.id,
    title: "New chat",
    visibility: selectedVisibilityType === "public" ? "public" : "private",
  });

  titlePromise = generateTitleFromUserMessage({ message: userMessage });
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

        // ✅ Guest үед tools унтраана
        const activeTools: ActiveTool[] = isGuest
          ? []
          : ["getWeather", "createDocument", "updateDocument", "requestSuggestions"];

        const result = streamText({
          model: getLanguageModel(selectedChatModel) as any,
          system: systemPrompt({ selectedChatModel, requestHints }) + activeContext,
          messages: await convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),

          experimental_activeTools: activeTools,
          experimental_transform: smoothStream({ chunking: "word" }),

          tools: {
            getWeather,
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
        // ✅ Guest үед DB хадгалалт ОГТ хийхгүй
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

    // ✅ Resumable stream: Guest үед ашиглахгүй (DB streamId-тэй уялддаг)
    if (streamContext && !isGuest) {
      try {
        const resumableStream = await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream())
        );

        if (resumableStream) {
          return new Response(resumableStream);
        }
      } catch (e) {
        console.error("Failed to create resumable stream:", e);
      }
    }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error: any) {
    // ✅ ChatSDKError бол яг тэр төрлийг нь буцаа
    if (error instanceof ChatSDKError) {
      console.error("ChatSDKError in /api/chat:", {
        code: (error as any).code,
        message: (error as any).message,
        cause: (error as any).cause,
        vercelId,
      });
      return error.toResponse();
    }

    console.error("Unhandled error in chat API:", error, {
      vercelId,
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });

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
    return Response.json({ ok: true, skipped: true }, { status: 200 });
  }

  const chat = await getChatById({ id });
  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
