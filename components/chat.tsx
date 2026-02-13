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
  AlertDialogAction,
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
    experimental_throttle: 100,
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
  fetch: (input, init) => {
    const mergedInit = { ...init, credentials: "same-origin" as const };
    return fetchWithErrorHandlers(input, mergedInit);
  },
 prepareSendMessagesRequest(request) {
  const bodyAny = (request.body ?? {}) as any;
  const lastMessage = request.messages.at(-1);

  // Tool approval / continuation үед бүтэн messages явуулах шаардлагатай
  const isToolApprovalContinuation =
    lastMessage?.role !== "user" ||
    request.messages.some((msg: any) =>
      msg.parts?.some((part: any) => {
        const state = part?.state;
        return state === "approval-responded" || state === "output-denied";
      })
    );

  // Аль нэг мессежийн parts дотор file байвал бүтэн messages явуулна
  const anyHasFilePart = request.messages.some((m: any) =>
    Array.isArray(m?.parts) && m.parts.some((p: any) => p?.type === "file")
  );

  const shouldSendFullMessages = isToolApprovalContinuation || anyHasFilePart;

  // request.body дотор message/messages байвал дарж болохгүй — авч хаяна
  const { message: _m, messages: _ms, ...restBody } = bodyAny;

  return {
    body: {
      id: request.id,
      selectedChatModel: currentModelIdRef.current,
      selectedVisibilityType: visibilityType,

      ...(shouldSendFullMessages
        ? { messages: request.messages }
        : { message: lastMessage }),

      ...restBody,
    },
  };
},


    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : [dataPart]));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        if (error.message?.includes("AI Gateway requires a valid credit card")) {
          setShowCreditCardAlert(true);
        } else {
          toast({ type: "error", description: error.message });
        }
      } else {
        toast({ type: "error", description: "Unexpected error" });
      }
    },
  });

  // ✅ давхар send хамгаалалт (хуучин төслөөс)
  const sendingRef = useRef(false);
  useEffect(() => {
    if (status === "ready") sendingRef.current = false;
  }, [status]);

  const resetDataStream = useCallback(() => setDataStream([]), [setDataStream]);

  const send = useCallback(
    async (msg: Parameters<typeof sendMessage>[0]) => {
      if (sendingRef.current) return;
      if (status !== "ready") return;

      sendingRef.current = true;

      try {
        stop();
      } catch {}

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
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
