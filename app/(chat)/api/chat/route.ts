import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";

import { cookies } from "next/headers";
import { getPgAdmin } from "@/lib/db/pgClient";

import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { shouldUseActiveArtifactContext } from "@/lib/ai/active-artifact-context";
import { buildUserMemoryContext } from "@/lib/ai/user-memory-context";
import { resolveSpecializedPromptIntent } from "@/lib/ai/prompt-intent";
import {
  countChatImages,
  prepareChatContextMessages,
} from "@/lib/ai/chat-context";
import { financePrompt, financeReceiptPrompt } from "@/lib/ai/prompts/finance";
import { foodPrompt, healthPrompt } from "@/lib/ai/prompts/food";
import { notesPrompt } from "@/lib/ai/prompts/notes";
import { onlinePsychologistPrompt } from "@/lib/ai/prompts/online-psychologist";
import { programsPrompt } from "@/lib/ai/prompts/programs";
import { selfUnderstandingPrompt } from "@/lib/ai/prompts/self-understanding";
import { specialistPrompt } from "@/lib/ai/prompts/specialist";
import { testsPrompt } from "@/lib/ai/prompts/tests";
import { getLanguageModel } from "@/lib/ai/providers";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import {
  MAIN_CHAT_MODEL,
  openAIReasoningOptions,
} from "@/lib/ai/image-models";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";

import {
  deleteChatById,
  ensureUserIdByEmail,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getUserSubscription,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";

import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { resolveSubscription } from "@/lib/subscription/access";
import {
  recordAppEvent,
  safeErrorMessage,
  usageEventFields,
} from "@/lib/observability/app-events";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

// Always null — resumable streams require Redis + Vercel infrastructure
type StreamContext = {
  resumableStream: (
    streamId: string,
    makeStream: () => ReadableStream
  ) => Promise<ReadableStream | null>;
};
export function getStreamContext(): StreamContext | null {
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
  const requestId = generateUUID();
  let requestBody: PostRequestBody;

  try {
    requestBody = postRequestBodySchema.parse(await request.json());
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedVisibilityType } = requestBody;
    // Model сонголтын UI түр хаалттай тул client-ээс ирсэн model-ийг үл тооно.
    const activeChatModel = DEFAULT_CHAT_MODEL;

    // 1) Auth — зөвхөн нэвтэрсэн regular хэрэглэгч (guest хандах эрхгүй)
    const session = await auth();
    if (!session?.user) return new ChatSDKError("unauthorized:chat").toResponse();

    if ((session.user.type ?? "regular") === "guest") {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const isGuest = false;

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
    let active: Awaited<ReturnType<typeof getActiveArtifactForUser>> = null;
    let kb: Awaited<ReturnType<typeof getKbArticleBySlug>> = null;

    // 4) Tool approval flow? — зөвхөн жинхэнэ tool-approval continuation
    // үед л true байх ёстой (approval-responded/output-denied state бүхий
    // part байгаа эсэхээр шалгана), зүгээр "messages" массив ирсэн эсэхээр
    // биш. Өмнө нь Boolean(messages) ашигладаг байсан тул зураг хавсаргасан
    // чат үед ч (client зурагтай бол бүх түүхийг array-аар явуулдаг байсан)
    // энэ true болж, шинэ хэрэглэгчийн мессежийг DB-д хадгалахгүй/буруу
    // update хийдэг байв (BUG-AUDIT-2026-07.md).
    const isToolApprovalFlow =
      Array.isArray(messages) &&
      messages.some((msg) =>
        msg.parts?.some((part) => {
          const state = (part as { state?: string }).state;
          return state === "approval-responded" || state === "output-denied";
        })
      );

    // Транспортын хэлбэрээс үл хамааран (single `message` эсвэл бүтэн
    // `messages` массив) хамгийн сүүлийн хэрэглэгчийн мессежийг олно.
    const newestUserMessage: ChatMessage | undefined =
      (message as ChatMessage | undefined) ??
      (Array.isArray(messages)
        ? [...(messages as ChatMessage[])].reverse().find((m) => m.role === "user")
        : undefined);

    // 5) Chat load / ownership (✅ Guest үед DB-ээс огт уншихгүй)
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (!isGuest) {
      if (!session.user.email) {
        return new ChatSDKError("unauthorized:chat").toResponse();
      }

      // ⚡ Хамааралгүй DB уншилтуудыг зэрэг явуулна (sequential round-trip-ийг
      // багасгаж, model рүү анхны хүсэлт явахаас өмнөх хүлээлтийг хасна).
      const [dbUserId, existingChat] = await Promise.all([
        ensureUserIdByEmail(session.user.email),
        getChatById({ id }),
      ]);

      fixedSession = {
        ...session,
        user: { ...session.user, id: dbUserId, type: "regular" },
      };

      userType = "regular";

      const [sub, activeResult, messageCount] = await Promise.all([
        getUserSubscription(dbUserId),
        getActiveArtifactForUser(dbUserId),
        getMessageCountByUserId({ id: dbUserId, differenceInHours: 24 }),
      ]);

      // 🔒 Subscription gate: free trial (1 day) then a paid period is required.
      if (sub) {
        const state = resolveSubscription(sub);
        if (!state.hasAccess) {
          return new ChatSDKError("forbidden:subscription").toResponse();
        }
      }

      // 3) Rate limit (Regular дээр DB-р)
      const limits =
        entitlementsByUserType[userType] ?? entitlementsByUserType["regular"];

      if (messageCount > limits.maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }

      active = activeResult;
      kb = active?.active_artifact_slug
        ? await getKbArticleBySlug(active.active_artifact_slug)
        : null;

      if (existingChat) {
        if (existingChat.userId !== fixedSession.user.id) {
          return new ChatSDKError("forbidden:chat").toResponse();
        }
        if (!isToolApprovalFlow) {
          messagesFromDb = await getMessagesByChatId({ id });
        }
      } else if (newestUserMessage?.role === "user") {
        await saveChat({
          id,
          userId: fixedSession.user.id,
          title: "New chat",
          visibility: selectedVisibilityType,
        });
        titlePromise = generateTitleFromUserMessage({
          message: newestUserMessage,
          context: {
            userId: fixedSession.user.id,
            chatId: id,
            requestId,
          },
        });
      }
    }

    // 6) Build UI messages — жинхэнэ tool-approval continuation биш үед,
    // client ямар хэлбэрээр илгээсэн эсэхээс үл хамааран DB-ийн жинхэнэ
    // түүх дээр зөвхөн newestUserMessage-ийг нэмнэ (client-ийн бүтэн
    // "messages" массивыг шууд итгэж уиMessages болгодог байсан бол,
    // DB-д хараахан ороогүй шинэ мессежийн id-г "already in DB" гэж
    // буруу тооцоод хадгалахгүй өнгөрдөг асуудлыг үүсгэдэг байв).
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), newestUserMessage as ChatMessage];
 // ✅ FINANCE mode: ЗӨВХӨН одоогийн (хамгийн сүүлийн) user turn-ийг шалгана.
// Урьд нь бүх түүхийг scan хийдэг байсан тул нэг л удаа "санхүү" гэж бичсэн бол
// тухайн чатын дараагийн БҮХ хариулт финанс prompt руу орж, mental-health
// system prompt-ыг бүрэн орхидог байсан (BUG-AUDIT-2026-06.md-г үз).
const latestUserMessage =
  newestUserMessage ?? [...uiMessages].reverse().find((m: any) => m.role === "user");

const latestParts: any[] = (latestUserMessage as any)?.parts ?? [];

const latestUserText = latestParts
  .filter((p: any) => p?.type === "text")
  .map((p: any) => String(p.text ?? ""))
  .join("\n");

// ✅ Гар утсан дээр “гарчиг таних” чинь эндээс явна (title+content хоёулаа орно)
const activeTitle = kb?.title ?? active?.active_artifact_title ?? "";
const activeContent = kb?.content ? String(kb.content) : "";
const useActiveContext = shouldUseActiveArtifactContext(
  latestUserText,
  activeTitle,
  activeContent
);
const activeContext =
  useActiveContext && (activeTitle || activeContent)
    ? `
[USER CURRENTLY READING]
Title: ${activeTitle}
Slug: ${kb?.slug ?? active?.active_artifact_slug ?? ""}
Id: ${active?.active_artifact_id ?? ""}

[ARTICLE CONTENT]
${clampText(activeContent, 6000)}

INSTRUCTION:
- Use this article only for the user's current question.
- Never introduce the article as the topic of an unrelated greeting or small-talk message.
`
    : "";

const userMemoryContext = await buildUserMemoryContext(
  fixedSession.user.id,
  latestUserText
);

// Хавсралт нь { type: "file", mediaType: "image/..." } хэлбэрээр ирдэг
// (multimodal-input.tsx). Өмнө нь type === "image" гэж шалгаж байсан тул
// зураг танихгүй (үргэлж false) байсан.
const imagePart = latestParts.find(
  (p: any) =>
    p?.type === "file" && String(p?.mediaType ?? "").startsWith("image/")
);

// Өмнө нь ЯМАР Ч зураг ирвэл шууд "баримт" (finance) гэж үздэг байсан тул
// хоолны зураг илгээхэд ч санхүүгийн prompt рүү орж, буруу хариу өгдөг байв.
// Одоо зургийг vision классификатораар ("receipt" | "food" | "other")
// ялгаж, тохирох prompt руу чиглүүлнэ.
let imageKind: "receipt" | "food" | "other" | null = null;
if (imagePart?.url) {
  try {
    const { classifyChatImage } = await import("@/lib/ai/classify-image");
    const { resolveFirstImageDataUri } = await import(
      "@/lib/ai/resolve-image-attachments"
    );
    // Манай upload URL нь /api/uploads/... хаяг руу зааж байгаа тул localhost
    // дээр турших үед OpenAI-ийн сервер үүнийг татаж авч чадахгүй (зөвхөн энэ
    // машинаас хандах боломжтой). Тул зургийг өөрсдөө татаж base64 болгож
    // дамжуулснаар орчноос үл хамааран найдвартай ажиллана.
    const dataUri = await resolveFirstImageDataUri(latestParts);
    imageKind = dataUri
      ? await classifyChatImage(dataUri, {
          userId: fixedSession.user.id,
          chatId: id,
          requestId,
        })
      : "receipt";
  } catch (e) {
    console.error("[chat] image classification failed:", e);
    // Ангилж чадаагүй үед хуучин зан төлөвийг хадгална — зургийг
    // "баримт" гэж үзнэ, учир нь энэ апп-ийн санхүүгийн урсгал үүн дээр тулгуурладаг.
    imageKind = "receipt";
    await recordAppEvent({
      level: "warn",
      event: "image_classification_failed",
      source: "image_classifier",
      route: "/api/chat",
      requestId,
      userId: fixedSession.user.id,
      chatId: id,
      model: "gpt-5.6-luna",
      errorCode: "classification_failed",
      message: safeErrorMessage(e),
      imageCount: 1,
    });
  }
}

// Монгол үгийн нөхцөл ("мэргэжилтний", "тестийн", "хөтөлбөрөөр" гэх мэт)
// болон богино follow-up turn-ийг таньж 7–13-р тусгай prompt-ийг хадгална.
// Сүүлийн turn өөр тусгай intent-ийг тодорхой хэлбэл тэр нь үргэлж давамгайлна.
const previousUserTexts = uiMessages
  .filter(
    (chatMessage) =>
      chatMessage.role === "user" &&
      chatMessage.id !== (latestUserMessage as any)?.id
  )
  .slice(-6)
  .reverse()
  .map((chatMessage) =>
    ((chatMessage as any).parts ?? [])
      .filter((part: any) => part?.type === "text")
      .map((part: any) => String(part.text ?? ""))
      .join("\n")
  );

const textIntent = resolveSpecializedPromptIntent({
  latestUserText,
  previousUserTexts,
});

const isReceiptIntent = imageKind === "receipt";
const isFinanceIntent = isReceiptIntent || textIntent === "finance";
const isFoodIntent = imageKind === "food";
const isHealthIntent =
  !isFinanceIntent && !isFoodIntent && textIntent === "health";
const isSelfUnderstandingIntent =
  !isFinanceIntent &&
  !isFoodIntent &&
  !isHealthIntent &&
  textIntent === "selfUnderstanding";
const isTestsIntent =
  !isFinanceIntent && !isFoodIntent && textIntent === "tests";
const isNotesIntent =
  !isFinanceIntent && !isFoodIntent && textIntent === "notes";
const isProgramsIntent =
  !isFinanceIntent && !isFoodIntent && textIntent === "programs";
const isSpecialistIntent =
  !isFinanceIntent && !isFoodIntent && textIntent === "specialist";
const isOnlinePsychologistIntent =
  !isFinanceIntent && !isFoodIntent && textIntent === "onlinePsychologist";

    // 7) Geo hints (no geolocation service — pass empty hints)
    const requestHints: RequestHints = {};

    // 8) Save ONLY user message (✅ Guest үед хадгалахгүй). Транспортын
    // хэлбэрээс (single message vs. full messages array) үл хамааран
    // newestUserMessage ашиглана — жинхэнэ tool-approval continuation үед
    // (шинэ хэрэглэгчийн мессеж байхгүй, зөвхөн approval үргэлжилж байгаа)
    // энэ мессеж аль хэдийн DB-д байгаа тул дахин хадгалахгүй.
    if (!isGuest && !isToolApprovalFlow && newestUserMessage?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: newestUserMessage.id,
            role: "user",
            parts: newestUserMessage.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    // 9) Stream id — ХАССАН. Resumable stream бүрэн унтраастай
    // (getStreamContext үргэлж null → [id]/stream route шууд 204 буцаадаг)
    // тул Stream хүснэгтийн бичилт хэзээ ч уншигддаггүй байсан. Мөн энэ
    // insert алдаа өгвөл чатын хүсэлтийг бүхэлд нь унагадаг байсан
    // ("Failed to create stream id" prod алдаа). Resume-ийг дахин нээвэл
    // createStreamId-г эндээс буцааж дуудна.

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
        const activeTools: ActiveTool[] =
          isGuest || isFinanceIntent || isFoodIntent
            ? []
            : [
                "getWeather",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
              ];

        const { resolveImageAttachmentsToDataUris } = await import(
          "@/lib/ai/resolve-image-attachments"
        );
        // Загварт очих зурган хавсралтуудын URL-г base64 болгож бэлтгэнэ —
        // OpenAI-ийн сервер манай /api/uploads URL-г шууд татаж чадахгүй тохиолдол
        // (жишээ нь localhost дээр турших үед) гарахаас сэргийлнэ.
        const contextMessages = prepareChatContextMessages(uiMessages);
        const historyCount = contextMessages.length;
        const imageCount = countChatImages(contextMessages);
        const modelReadyMessages =
          await resolveImageAttachmentsToDataUris(contextMessages);
        const responseModel =
          imageKind === null ? activeChatModel : MAIN_CHAT_MODEL;
        const intent = isReceiptIntent
          ? "finance_receipt"
          : isFinanceIntent
            ? "finance"
          : isFoodIntent
            ? "food"
            : isHealthIntent
              ? "health"
              : isSelfUnderstandingIntent
                ? "self_understanding"
                : isTestsIntent
                  ? "tests"
                  : isNotesIntent
                    ? "notes"
                    : isProgramsIntent
                      ? "programs"
                      : isSpecialistIntent
                        ? "specialist"
                        : isOnlinePsychologistIntent
                          ? "online_psychologist"
                          : "general";
        const modelStartedAt = Date.now();

        const result = streamText({
          model: getLanguageModel(responseModel) as any,
          providerOptions: openAIReasoningOptions(
            imageKind === null ? "none" : "low"
          ),
      system: (isReceiptIntent
  ? financeReceiptPrompt
  : isFinanceIntent
    ? financePrompt
    : isFoodIntent
      ? foodPrompt
      : isHealthIntent
        ? healthPrompt
        : isSelfUnderstandingIntent
          ? selfUnderstandingPrompt
          : isTestsIntent
            ? testsPrompt
            : isNotesIntent
              ? notesPrompt
              : isProgramsIntent
                ? programsPrompt
                : isSpecialistIntent
                  ? specialistPrompt
                  : isOnlinePsychologistIntent
                    ? onlinePsychologistPrompt
                    : systemPrompt({ selectedChatModel: activeChatModel, requestHints, userText: latestUserText })) + activeContext + userMemoryContext,
          // ⚡ Загварт зөвхөн сүүлийн 12 мессежийг өгч, өмнөх turn-үүдийн
          // зургуудыг дахин илгээхгүй. UI болон DB хадгалалт бүтнээрээ үлдэнэ.
          messages: await convertToModelMessages(modelReadyMessages),
          stopWhen: stepCountIs(5),

          // Word-by-word typewriter effect. Хэрэглэгч уншиж дагахад эвтэйхэн,
          // жигд урсгалтай харагдуулахын тулд үг хоорондын зайг 45ms болгов.
          experimental_transform: smoothStream({
            chunking: "word",
            delayInMs: 45,
          }),

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
          onFinish: async ({ totalUsage, finishReason, steps }) => {
            await recordAppEvent({
              level: "info",
              event: "ai_chat_completed",
              source: "ai_chat",
              route: "/api/chat",
              requestId,
              userId: fixedSession.user.id,
              chatId: id,
              model: responseModel,
              durationMs: Date.now() - modelStartedAt,
              historyCount,
              imageCount,
              ...usageEventFields(totalUsage),
              metadata: {
                intent,
                finishReason,
                stepCount: steps.length,
                activeToolCount: activeTools.length,
              },
            });
          },
          onError: async ({ error }) => {
            await recordAppEvent({
              level: "error",
              event: "ai_chat_failed",
              source: "ai_chat",
              route: "/api/chat",
              requestId,
              userId: fixedSession.user.id,
              chatId: id,
              model: responseModel,
              errorCode: "model_stream_error",
              message: safeErrorMessage(error),
              durationMs: Date.now() - modelStartedAt,
              historyCount,
              imageCount,
              metadata: { intent },
            });
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
        recordAppEvent({
          level: "error",
          event: "chat_ui_stream_failed",
          source: "chat_stream",
          route: "/api/chat",
          requestId,
          userId: fixedSession.user.id,
          chatId: requestBody.id,
          errorCode: "ui_stream_error",
          message: safeErrorMessage(e),
        }).catch((logError) => {
          console.error("[chat stream] failed to record error:", logError);
        });
        return "Oops, an error occurred!";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-Request-ID": requestId,
      },
    });
  } catch (error: any) {
    await recordAppEvent({
      level: "error",
      event: "chat_request_failed",
      source: "chat_api",
      route: "/api/chat",
      requestId,
      chatId: requestBody.id,
      errorCode:
        error instanceof ChatSDKError
          ? `${error.type}:${error.surface}`
          : "unhandled_error",
      message: safeErrorMessage(error),
    });
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
