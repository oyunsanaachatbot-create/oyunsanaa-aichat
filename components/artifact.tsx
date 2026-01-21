mport type { UseChatHelpers } from "@ai-sdk/react";
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
import useSWR, { useSWRConfig } from "swr";
import { useDebounceCallback, useWindowSize } from "usehooks-ts";

import { codeArtifact } from "@/artifacts/code/client";
import { imageArtifact } from "@/artifacts/image/client";
import { sheetArtifact } from "@/artifacts/sheet/client";
import { textArtifact } from "@/artifacts/text/client";
import { useArtifact } from "@/hooks/use-artifact";
import type { Document, Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetcher } from "@/lib/utils";

import { ArtifactActions } from "./artifact-actions";
import { ArtifactCloseButton } from "./artifact-close-button";
import { ArtifactMessages } from "./artifact-messages";
import { MultimodalInput } from "./multimodal-input";
import { Toolbar } from "./toolbar";
import { useSidebar } from "./ui/sidebar";
import { VersionFooter } from "./version-footer";
import type { VisibilityType } from "./visibility-selector";

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];
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

function CleanStaticText({ content }: { content: string }) {
  const blocks = content
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  // ✅ зөвхөн энэ гарчиг гарвал "бичих хэсэг" гэж үзнэ
  const PRACTICE_TITLE = "Жижиг бичих дадлага буюу өөртөө бичих хэсэг";

  const [first, ...rest] = blocks;

  // ✅ local scratch (хадгалахгүй)
  const [scratch, setScratch] = useState("");

  // ✅ дасгалын хэсэг эхэлсэн эсэх
  let inPractice = false;

  return (
    <div className="space-y-4">
      {/* хамгийн дээд том гарчиг */}
      <div className="text-[22px] leading-8 font-semibold">{first}</div>

      {rest.map((block, idx) => {
        const oneLine = !block.includes("\n");
        const short = block.length <= 80;
        const endsWithDot = block.trim().endsWith(".");
        const looksLikeHeading = oneLine && short && !endsWithDot;

        // ✅ дасгалын хэсэг эхлэхийг танина
        if (block === PRACTICE_TITLE) {
          inPractice = true;
          return (
            <div key={idx} className="pt-4 text-[15px] font-semibold leading-6">
              {block}
            </div>
          );
        }

        // ✅ дасгалын хэсэг доторхи асуултуудыг илүү тод гаргана
        if (inPractice && looksLikeHeading) {
          return (
            <div key={idx} className="pt-4 text-[15px] font-semibold leading-6">
              {block}
            </div>
          );
        }

        // ✅ дасгалын хэсэг дотор: "Энд бич..." гэдэг заавар мөрүүдийг бүдэг болгоё
        if (inPractice && block.startsWith("Энд бичсэн зүйлээ") ) {
          return (
            <div key={idx} className="text-[13px] leading-6 text-muted-foreground">
              {block}
            </div>
          );
        }

        // ✅ дасгалын хэсэг дуусахаас өмнө 1 удаа л бичих талбар гаргана
        // (“Энд бич...” зааврын яг өмнө гаргах хувилбар)
        if (inPractice && block === "Надад одоо юу дутуу байна вэ?") {
          return (
            <div key={idx} className="space-y-3 pt-4">
              <div className="text-[15px] font-semibold leading-6">{block}</div>

              {/* ✅ бичих хэсэг (хадгалахгүй) */}
              <div className="text-[13px] text-muted-foreground">
                Энд чөлөөтэй бичиж болно (хадгалахгүй). Хүсвэл хуулж аваад чатандаа нааж болно.
              </div>

              {/* ✅ хүснэгтгүй мэт болгохыг хүсвэл доорх textarea-г contentEditable болгоод өгнө */}
              <textarea
                value={scratch}
                onChange={(e) => setScratch(e.target.value)}
                placeholder="..."
                className="w-full min-h-[140px] rounded-xl border bg-transparent p-3 text-[15px] leading-7 outline-none"
              />
            </div>
          );
        }

        // ✅ энгийн гарчиг
        if (!inPractice && looksLikeHeading) {
          return (
            <div key={idx} className="pt-4 text-[15px] font-semibold leading-6">
              {block}
            </div>
          );
        }

        // ✅ энгийн текст
        return (
          <div key={idx} className="whitespace-pre-line text-[15px] leading-7">
            {block}
          </div>
        );
      })}
    </div>
  );
}
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
  const isStaticArtifact = artifact.documentId.startsWith("static-");


  // ✅ Mobile drawer chat (ганц state, давхардахгүй)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

 const {
  data: documents,
  isLoading: isDocumentsFetching,
  mutate: mutateDocuments,
} = useSWR<Document[]>(
  !isStaticArtifact && artifact.documentId !== "init"
    ? `/api/document?id=${artifact.documentId}`
    : null,
  fetcher
);


  const [mode, setMode] = useState<"edit" | "diff">("edit");
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  const { open: isSidebarOpen } = useSidebar();

 useEffect(() => {
  // ✅ STATIC үед local content-ийг DB-ээр overwrite хийхгүй
  if (isStaticArtifact) return;

  if (documents && documents.length > 0) {
    const mostRecentDocument = documents.at(-1);
    if (mostRecentDocument) {
      setDocument(mostRecentDocument);
      setCurrentVersionIndex(documents.length - 1);
      setArtifact((currentArtifact) => ({
        ...currentArtifact,
        content: mostRecentDocument.content ?? "",
      }));
    }
  }
}, [documents, isStaticArtifact, setArtifact]);

 

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      mutate<Document[]>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return [];

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: "POST",
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }

          return currentDocuments;
        },
        { revalidate: false }
      );
    },
    [artifact, mutate]
  );

  const debouncedHandleContentChange = useDebounceCallback(handleContentChange, 2000);

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) debouncedHandleContentChange(updatedContent);
        else handleContentChange(updatedContent);
      }
    },
    [document, debouncedHandleContentChange, handleContentChange]
  );

  function getDocumentContentById(index: number) {
    if (!documents) return "";
    if (!documents[index]) return "";
    return documents[index].content ?? "";
  }

  const handleVersionChange = (type: "next" | "prev" | "toggle" | "latest") => {
    if (!documents) return;

    if (type === "latest") {
      setCurrentVersionIndex(documents.length - 1);
      setMode("edit");
    }

    if (type === "toggle") {
      setMode((currentMode) => (currentMode === "edit" ? "diff" : "edit"));
    }

    if (type === "prev") {
      if (currentVersionIndex > 0) setCurrentVersionIndex((i) => i - 1);
    } else if (type === "next" && currentVersionIndex < documents.length - 1) {
      setCurrentVersionIndex((i) => i + 1);
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

 const artifactDefinition = artifactDefinitions.find(
  (definition) => definition.kind === artifact.kind
);

if (!artifactDefinition) throw new Error("Artifact definition not found!");

// 👇 ЭНД НЭМНЭ
useEffect(() => {
  console.log(
    "ARTIFACT DEBUG:",
    "documentId =", artifact.documentId,
    "status =", artifact.status
  );
}, [artifact.documentId, artifact.status]);

useEffect(() => {
  if (artifact.documentId !== "init" && artifactDefinition.initialize) {
    artifactDefinition.initialize({
      documentId: artifact.documentId,
      setMetadata,
    });
  }
}, [artifact.documentId, artifactDefinition, setMetadata]);


  // ✅ Mobile үед artifact хаагдах/солигдоход drawer автоматаар хаая
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
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="absolute top-0 left-0 z-50 h-dvh w-[400px] bg-zinc-900/50"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

          <div className="flex h-full flex-col">

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
                    width: windowWidth ? windowWidth - 400 : "calc(100dvw-400px)",
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
           className="fixed flex h-dvh flex-col overflow-hidden border-zinc-200 bg-background md:border-l dark:border-zinc-700 dark:bg-muted"

            exit={{
              opacity: 0,
              scale: 0.5,
              transition: { delay: 0.1, type: "spring", stiffness: 600, damping: 30 },
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
                    <div className="text-muted-foreground text-sm">Saving changes...</div>
                  ) : document ? (
                    <div className="text-muted-foreground text-sm">
                      {`Updated ${formatDistance(new Date(document.createdAt), new Date(), {
                        addSuffix: true,
                      })}`}
                    </div>
                  ) : (
                    <div className="mt-2 h-3 w-32 animate-pulse rounded-md bg-muted-foreground/20" />
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
      <div className="min-h-0 flex-1 !max-w-full overflow-y-auto bg-background dark:bg-muted">
  {/* ✅ STATIC үед: renderer-ээс хамаарахгүйгээр шууд текст харуулна */}
  {isStaticArtifact ? (
  <div className="p-4">
    <CleanStaticText content={artifact.content} />
  </div>
) : (
  <artifactDefinition.content
    content={
      isCurrentVersion
        ? artifact.content
        : getDocumentContentById(currentVersionIndex)
    }
    currentVersionIndex={currentVersionIndex}
    getDocumentContentById={getDocumentContentById}
    isCurrentVersion={isCurrentVersion}
    isInline={false}
    isLoading={isDocumentsFetching && !artifact.content}
    metadata={metadata}
    mode={mode}
    onSaveContent={saveContent}
    setMetadata={setMetadata}
    status={artifact.status}
    suggestions={[]}
    title={artifact.title}
  />
)}


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


            {/* ✅ Mobile: ганц Chat toggle товч (toolbar-тай огт холихгүй) */}
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

            {/* ✅ Mobile drawer chat (доороос гарч ирнэ) */}
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
if (prevProps.messages.length !== nextProps.messages.length) return false;

  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false;
  return true;
});
