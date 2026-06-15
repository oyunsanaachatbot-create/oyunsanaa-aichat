import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
} from "ai";

import { cookies } from "next/headers";
import { getPgAdmin } from "@/lib/db/pgClient";

import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { financePrompt } from "@/lib/ai/prompts/finance";
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

// Always null — resumable streams require Redis + Vercel infrastructure
export function getStreamContext() {
  return null;
}

// ✅ TypeScript-д activeTools төрлийг яг зааж өгнө
type ActiveTool =
  | "getWeather"
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions";

/** Local PG admin client — replaces Supabase admin */
function getSupabaseAdmin() {
  return getPgAdmin();
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
        await saveChat({
          id,
          userId: fixedSession.user.id,
          title: "New chat",
          visibility: selectedVisibilityType,
        });
        titlePromise = generateTitleFromUserMessage({ message });
      }
    }

    // 6) Build UI messages
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];
 // ✅ FINANCE mode: token хэрэггүй — keyword + image-ээр танина
const allUserText = (uiMessages ?? [])
  .filter((m) => m.role === "user")
  .flatMap((m: any) => m.parts ?? [])
  .filter((p: any) => p?.type === "text")
  .map((p: any) => String(p.text ?? ""))
  .join("\n");

const hasReceiptImage = (uiMessages ?? []).some((m: any) =>
  (m.parts ?? []).some((p: any) => p?.type === "image")
);

const t = allUserText.toLowerCase();
const isFinanceKeyword =
  t.includes("санхүү") ||
  t.includes("баримт") ||
  t.includes("баримтаа") ||
  t.includes("бүртгүүлье") ||
  t.includes("зургаа");

const isFinanceIntent = hasReceiptImage || isFinanceKeyword;

    // 7) Geo hints (no geolocation service — pass empty hints)
    const requestHints: RequestHints = {};

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
      originalMessages: uiMessages,

      execute: async ({ writer: dataStream }) => {
        if (!isGuest && titlePromise) {
          titlePromise
            .then((title) => {
              updateChatTitleById({ chatId: id, title });
              // Write to stream only if still open — if already closed, skip silently
              try {
                dataStream.write({ type: "data-chat-title", data: title });
              } catch {
                // stream closed before title resolved — DB is already updated above
              }
            })
            .catch((e) => {
              console.error("[chat] title generation failed:", e);
            });
        }

        // ✅ Guest үед tools унтраана
        const activeTools: ActiveTool[] = isGuest
          ? []
          : ["getWeather", "createDocument", "updateDocument", "requestSuggestions"];

        const result = streamText({
          model: getLanguageModel(selectedChatModel) as any,
      system: isFinanceIntent
  ? financePrompt
  : systemPrompt({ selectedChatModel, requestHints }) + activeContext,
          messages: await convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),

          experimental_activeTools: activeTools,
     

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

       
      dataStream.merge(result.toUIMessageStream());
      },

      generateId: generateUUID,

      onFinish: async ({ messages: finishedMessages }) => {
        if (isGuest) return;

        try {
          // IDs already in the DB before this turn — don't re-insert them
          const existingIds = new Set(uiMessages.map((m) => m.id));

          if (isToolApprovalFlow) {
            for (const finishedMsg of finishedMessages) {
              const alreadyInDb = existingIds.has(finishedMsg.id);
              if (alreadyInDb) {
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
          } else {
            // Only save messages that are NOT already in the DB
            const newMessages = finishedMessages.filter((m) => !existingIds.has(m.id));
            console.log("[onFinish] finished:", finishedMessages.length, "new:", newMessages.length);

            if (newMessages.length > 0) {
              await saveMessages({
                messages: newMessages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  parts: m.parts,
                  createdAt: new Date(),
                  attachments: [],
                  chatId: id,
                })),
              });
            }
          }
        } catch (e: any) {
          console.error("[onFinish] error saving messages:", {
            message: e?.message,
            code: e?.code,
            detail: e?.detail,
            constraint: e?.constraint,
          });
          // Don't re-throw — prevents a DB error from sending an error event
          // to the client and locking the chat input.
        }
      },

      onError: (e) => {
        console.error("[chat stream] onError:", e);
        return "Oops, an error occurred!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    // ✅ ChatSDKError бол яг тэрийг нь буцаая (cause-оо логлоно)
    if (error instanceof ChatSDKError) {
      console.error("ChatSDKError in /api/chat:", {
        code: (error as any).code,
        message: (error as any).message,
        cause: (error as any).cause,
      });
      return error.toResponse();
    }

    // ✅ Бусад бүх error
    console.error("Unhandled error in chat API:", error, {
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
