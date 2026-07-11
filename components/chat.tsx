"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useSubscribeDialog } from "@/hooks/use-subscribe-dialog";

import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

// хуучин төсөл шиг: cookie/session заавал явуулах
const fetchForChat: typeof fetch = (input, init) => {
  return fetch(input, {
    ...init,
    credentials: "same-origin",
  });
};

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openSubscribeDialog } = useSubscribeDialog();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);

  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // back/forward sync
  useEffect(() => {
    const handlePopState = () => router.refresh();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 50,
    generateId: generateUUID,

    // tool approval auto-continue (одоогийн төслийн чухал урсгал)
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      const shouldContinue =
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false;
      return shouldContinue;
    },

    transport: new DefaultChatTransport({
      api: "/api/chat",

      // ✅ cookie/session найдвартай явуулна
      fetch: (input, init) => {
        // existing error handler чинь хэрэгтэй байж магадгүй, эвдэхгүйгээр хамтад нь хэрэглэе
        // fetchWithErrorHandlers дотор credentials тохируулаагүй бол:
        // 1) эхлээд same-origin шургуулна
        // 2) дараа нь error handler-тай fetch хийнэ
        const mergedInit = { ...init, credentials: "same-origin" as const };
        // fetchWithErrorHandlers нь fetch signature-тай
        return fetchWithErrorHandlers(input, mergedInit);
      },

      // ✅ энд л “зураг/attachment алга болдог” асуудлыг хамгаална
     prepareSendMessagesRequest(request) {
  const lastMessage = request.messages.at(-1);

  const isToolApprovalContinuation =
    lastMessage?.role !== "user" ||
    request.messages.some((msg) =>
      msg.parts?.some((part) => {
        const state = (part as { state?: string }).state;
        return state === "approval-responded" || state === "output-denied";
      })
    );

  // image/file зэрэг non-text part байгаа эсэх — ЗӨВХӨН одоогийн (сүүлийн)
  // turn-ийг шалгана. Өмнө нь бүх түүхээс шалгадаг байсан тул нэг л удаа
  // зураг илгээсэн чат дараагийн БҮХ (текст ч гэсэн) turn-ийг "messages"
  // массив хэлбэрээр явуулж, серверийн isToolApprovalFlow-г буруу true
  // болгож, шинэ хэрэглэгчийн мессежийг DB-д хадгалахгүй алдаа гаргадаг
  // байсан (server route.ts-ийн isToolApprovalFlow-той хамт заавал засах).
  const lastHasNonTextParts =
    lastMessage?.role === "user"
      ? (lastMessage.parts ?? []).some((p: any) => p?.type && p.type !== "text")
      : false;

  const bodyAny = request.body as any;
  const bodyHasAttachments =
    Array.isArray(bodyAny?.attachments) && bodyAny.attachments.length > 0;

  const shouldSendFullMessages =
    isToolApprovalContinuation || lastHasNonTextParts || bodyHasAttachments;

  return {
    body: {
      id: request.id,
      ...(shouldSendFullMessages
        ? { messages: request.messages }
        : { message: lastMessage }),
      selectedChatModel: currentModelIdRef.current,
      selectedVisibilityType: visibilityType,
      ...request.body,
    },
  };
},
    }),

    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : [dataPart]));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        if (error.surface === "subscription") {
          // Trial expired / no active subscription — open the checkout popup.
          toast({ type: "error", description: error.message });
          openSubscribeDialog();
        } else if (error.message?.includes("AI Gateway requires a valid credit card")) {
          setShowCreditCardAlert(true);
        } else {
          toast({ type: "error", description: error.message });
        }
      } else {
        toast({
          type: "error",
          description: error?.message || "Unexpected error",
        });
      }
    },
  });

  const resetDataStream = useCallback(() => setDataStream([]), [setDataStream]);

  const send = useCallback(
    async (msg: Parameters<typeof sendMessage>[0]) => {
      // Allow sending when "ready" or "error" — AI SDK's status is the authoritative guard
      if (status !== "ready" && status !== "error") return;

      stop();
      resetDataStream();
      return await sendMessage(msg);
    },
    [sendMessage, resetDataStream, status, stop]
  );

  const regen = useCallback(async () => {
    if (status !== "ready") return;
    resetDataStream();
    return await regenerate();
  }, [regenerate, resetDataStream, status]);

  // query param -> 1 удаа явуулна
  const query = searchParams.get("query");
  const appendedQueryRef = useRef(false);

  useEffect(() => {
    appendedQueryRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!query) return;
    if (appendedQueryRef.current) return;

    appendedQueryRef.current = true;

    send({
      role: "user",
      parts: [{ type: "text", text: query }],
    });

    router.replace(`/chat/${id}`);
  }, [query, id, send, router]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${encodeURIComponent(id)}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          addToolApprovalResponse={addToolApprovalResponse}
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regen}
          selectedModelId={currentModelId}
          setMessages={setMessages}
          status={status}
          votes={votes}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={send}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
            />
          )}
        </div>
      </div>

      <Artifact
        addToolApprovalResponse={addToolApprovalResponse}
        attachments={attachments}
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={regen}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={send}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Provider Error</AlertDialogTitle>
            <AlertDialogDescription>
              The AI provider requires additional configuration. Please contact the administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCreditCardAlert(false)}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
