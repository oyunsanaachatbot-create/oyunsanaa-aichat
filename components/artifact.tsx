import type { UseChatHelpers } from "@ai-sdk/react";
import { formatDistance } from "date-fns";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import useSWRConfigOnly, { useSWRConfig } from "swr"; // keep import shape stable
import { useDebounceCallback, useWindowSize } from "usehooks-ts";

import { codeArtifact } from "@/artifacts/code/client";
import { imageArtifact } from "@/artifacts/image/client";
import { sheetArtifact } from "@/artifacts/sheet/client";
import { textArtifact } from "@/artifacts/text/client";
import { useArtifact } from "@/hooks/use-artifact";
import type { Document, Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";

import { ArtifactActions } from "./artifact-actions";
import { ArtifactCloseButton } from "./artifact-close-button";
import { ArtifactMessages } from "./artifact-messages";
import { MultimodalInput } from "./multimodal-input";
import { Toolbar } from "./toolbar";
import { useSidebar } from "./ui/sidebar";
import { VersionFooter } from "./version-footer";
import type { VisibilityType } from "./visibility-selector";

/**
 * ✅ DB унасан үед artifact panel chat-ийг эвдэж байгааг зогсоох "fail-open" горим.
 * - true болгохыг зөвхөн /api/document (DB/RLS) бүрэн зассаны дараа хийнэ.
 */
const ARTIFACT_DB_ENABLED = false;

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
] as const;
export type ArtifactKind = (typeof artifactDefinitions)[number]["kind"];

export type UIArtifact = {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: "streaming" | "idle";
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

function PureArtifact({
  addToolApprovalResponse,
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  messages,
  setMessages,
  regenerate,
  votes,
  isReadonly,
  selectedVisibilityType,
  selectedModelId,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  votes: Vote[] | undefined;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();

  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // ✅ DB disabled үед documents байхгүй (local-only)
  const documents: Document[] | undefined = undefined;
  const isDocumentsFetching = false;
  const mutateDocuments = useCallback(() => Promise.resolve(undefined), []);

  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  const { open: isSidebarOpen } = useSidebar();

  // ✅ DB унтарсан үед документ байхгүй — гэхдээ UI ажиллана
  useEffect(() => {
    if (!ARTIFACT_DB_ENABLED) {
      setDocument(null);
      setCurrentVersionIndex(-1);
      return;
    }
  }, []);

  // (хуучин logic-ийг эвдэхгүй гэж үлдээнэ, гэхдээ DB унтарсан тул ажиллахгүй)
  useEffect(() => {
    if (ARTIFACT_DB_ENABLED) mutateDocuments();
  }, [mutateDocuments]);

  const { mutate } = useSWRConfig(); // keep existing hook usage
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    async (updatedContent: string) => {
      // ✅ DB унтарсан үед: локал дээрээ л хадгална
      setArtifact((a) => ({ ...a, content: updatedContent }));
      setIsContentDirty(false);

      // DB асаалттай үед л эндээс доош үргэлжлүүлнэ (одоо disabled)
      if (!ARTIFACT_DB_ENABLED) return;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _unused = mutate; // prevent lint complaining in some setups
    },
    [setArtifact, mutate]
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      // ✅ local-only save: artifact.content өөрчлөгдвөл dirty гэж үзээд хадгална
      if (updatedContent !== artifact.content) {
        setIsContentDirty(true);
        if (debounce) debouncedHandleContentChange(updatedContent);
        else handleContentChange(updatedContent);
      }
    },
    [artifact.content, debouncedHandleContentChange, handleContentChange]
  );

  function getDocumentContentById(_index: number) {
    // ✅ DB унтарсан үед хувилбарууд байхгүй
    return "";
  }

  const handleVersionChange = (type: "next" | "prev" | "toggle" | "latest") => {
    // ✅ DB унтарсан үед version байхгүй — toggle л ажиллуулж болно
    if (type === "toggle") {
      setMode((m) => (m === "edit" ? "diff" : "edit"));
    }
    if (type === "latest") {
      setMode("edit");
      setCurrentVersionIndex(-1);
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const isCurrentVersion = true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind
  );

  if (!artifactDefinition) throw new Error("Artifact definition not found!");

  useEffect(() => {
    if (artifact.documentId !== "init" && artifactDefinition.initialize) {
      artifactDefinition.initialize({
        documentId: artifact.documentId,
        setMetadata,
      });
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  useEffect(() => {
    if (!isMobile) setIsMobileChatOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!artifact.isVisible) setIsMobileChatOpen(false);
  }, [artifact.isVisible]);

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed top-0 left-0 z-50 flex h-dvh w-dvw flex-row bg-transparent"
          data-testid="artifact"
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
          initial={{ opacity: 1 }}
        >
          {/* Desktop backdrop */}
          {!isMobile && (
            <motion.div
              animate={{ width: windowWidth, right: 0 }}
              className="fixed h-dvh bg-background"
              exit={{
                width: isSidebarOpen ? (windowWidth ?? 0) - 256 : windowWidth,
                right: 0,
              }}
              initial={{
                width: isSidebarOpen ? (windowWidth ?? 0) - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {/* Desktop left chat panel */}
          {!isMobile && (
            <motion.div
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                },
              }}
              className="relative h-dvh w-[400px] shrink-0 bg-muted dark:bg-background"
              exit={{ opacity: 0, x: 0, scale: 1, transition: { duration: 0 } }}
              initial={{ opacity: 0, x: 10, scale: 1 }}
            >
              <div className="flex h-full flex-col items-center justify-between">
                <ArtifactMessages
                  addToolApprovalResponse={addToolApprovalResponse}
                  artifactStatus={artifact.status}
                  chatId={chatId}
                  isReadonly={isReadonly}
                  messages={messages}
                  regenerate={regenerate}
                  setMessages={setMessages}
                  status={status}
                  votes={votes}
                />

                <div className="relative flex w-full flex-row items-end gap-2 px-4 pb-4">
                  <MultimodalInput
                    attachments={attachments}
                    chatId={chatId}
                    className="bg-background dark:bg-muted"
                    input={input}
                    messages={messages}
                    selectedModelId={selectedModelId}
                    selectedVisibilityType={selectedVisibilityType}
                    sendMessage={sendMessage}
                    setAttachments={setAttachments}
                    setInput={setInput}
                    setMessages={setMessages}
                    status={status}
                    stop={stop}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Right (artifact content) */}
          <motion.div
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : "calc(100dvw)",
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.8,
                    },
                  }
                : {
                    opacity: 1,
                    x: 400,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth - 400
                      : "calc(100dvw-400px)",
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.8,
                    },
                  }
            }
            className="fixed flex h-dvh flex-col overflow-y-scroll border-zinc-200 bg-background md:border-l dark:border-zinc-700 dark:bg-muted"
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: "spring",
                stiffness: 600,
                damping: 30,
              },
            }}
            initial={{
              opacity: 1,
              x: artifact.boundingBox.left,
              y: artifact.boundingBox.top,
              height: artifact.boundingBox.height,
              width: artifact.boundingBox.width,
              borderRadius: 50,
            }}
          >
            {/* Header */}
            <div className="flex flex-row items-start justify-between p-2">
              <div className="flex flex-row items-start gap-4">
                <ArtifactCloseButton />

                <div className="flex flex-col">
                  <div className="font-medium">{artifact.title}</div>

                  {isContentDirty ? (
                    <div className="text-muted-foreground text-sm">
                      Saving changes...
                    </div>
                  ) : document ? (
                    <div className="text-muted-foreground text-sm">
                      {`Updated ${formatDistance(new Date(document.createdAt), new Date(), {
                        addSuffix: true,
                      })}`}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {/* ✅ DB унтарсан үед */}
                      Local mode
                    </div>
                  )}
                </div>
              </div>

              <ArtifactActions
                artifact={artifact}
                currentVersionIndex={currentVersionIndex}
                handleVersionChange={handleVersionChange}
                isCurrentVersion={isCurrentVersion}
                metadata={metadata}
                mode={mode}
                setMetadata={setMetadata}
              />
            </div>

            {/* Content */}
            <div className="h-full max-w-full! items-center overflow-y-scroll bg-background dark:bg-muted">
              <artifactDefinition.content
                content={artifact.content}
                currentVersionIndex={currentVersionIndex}
                getDocumentContentById={getDocumentContentById}
                isCurrentVersion={isCurrentVersion}
                isInline={false}
                isLoading={false}
                metadata={metadata}
                mode={mode}
                onSaveContent={saveContent}
                setMetadata={setMetadata}
                status={artifact.status}
                suggestions={[]}
                title={artifact.title}
              />

              <AnimatePresence>
                {isCurrentVersion && (
                  <Toolbar
                    artifactKind={artifact.kind}
                    isToolbarVisible={isToolbarVisible}
                    sendMessage={sendMessage}
                    setIsToolbarVisible={setIsToolbarVisible}
                    setMessages={setMessages}
                    status={status}
                    stop={stop}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Mobile chat toggle */}
            {isMobile && (
              <button
                type="button"
                className="fixed bottom-6 right-6 z-[60] rounded-full border bg-background p-4 shadow-lg"
                onClick={() => setIsMobileChatOpen((v) => !v)}
                aria-label="Open chat"
              >
                💬
              </button>
            )}

            {/* Mobile drawer chat */}
            <AnimatePresence>
              {isMobile && isMobileChatOpen && (
                <motion.div
                  initial={{ y: 400, opacity: 1 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 400, opacity: 1 }}
                  className="fixed left-0 right-0 bottom-0 z-[70] h-[55dvh] border-t bg-background dark:bg-muted"
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <div className="text-sm font-medium">Энэ сэдвээр асуух</div>
                      <button
                        type="button"
                        className="text-sm text-muted-foreground"
                        onClick={() => setIsMobileChatOpen(false)}
                      >
                        Хаах
                      </button>
                    </div>

                    <div className="min-h-0 flex-1">
                      <ArtifactMessages
                        addToolApprovalResponse={addToolApprovalResponse}
                        artifactStatus={artifact.status}
                        chatId={chatId}
                        isReadonly={isReadonly}
                        messages={messages}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        status={status}
                        votes={votes}
                      />
                    </div>

                    <div className="px-3 pb-3 pt-2 border-t">
                      <MultimodalInput
                        attachments={attachments}
                        chatId={chatId}
                        className="bg-background dark:bg-muted"
                        input={input}
                        messages={messages}
                        selectedModelId={selectedModelId}
                        selectedVisibilityType={selectedVisibilityType}
                        sendMessage={sendMessage}
                        setAttachments={setAttachments}
                        setInput={setInput}
                        setMessages={setMessages}
                        status={status}
                        stop={stop}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!isCurrentVersion && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  documents={documents}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.input !== nextProps.input) return false;
  // NOTE: this was buggy before (messages vs messages.length), keep stable minimal
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
    return false;
  return true;
});
