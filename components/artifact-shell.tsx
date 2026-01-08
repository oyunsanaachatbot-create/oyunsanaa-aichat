"use client";

import { useArtifact } from "@/hooks/use-artifact";
import { useTopic } from "@/hooks/use-topic";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

// shadcn sheet
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ArtifactShell() {
  const { artifact, setArtifact } = useArtifact();
  const { clearTopic } = useTopic();

  const close = () => {
    clearTopic();
    setArtifact((a) => ({ ...a, isVisible: false }));
  };

  if (!artifact?.isVisible) return null;

  // ✅ Desktop: side panel (md дээш)
  // ✅ Mobile: Sheet (доороос/хажуугаас)
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <Sheet open={artifact.isVisible} onOpenChange={(open) => !open && close()}>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="text-base">{artifact.title}</SheetTitle>
                <Button variant="ghost" size="icon" onClick={close} aria-label="Close">
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            <div className="px-4 pb-6 overflow-y-auto h-[calc(85vh-60px)] whitespace-pre-wrap text-sm">
              {artifact.content}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="fixed right-0 top-0 h-screen w-[420px] border-l bg-background z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold text-sm">{artifact.title}</div>
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close">
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="px-4 py-4 overflow-y-auto h-[calc(100vh-52px)] whitespace-pre-wrap text-sm">
            {artifact.content}
          </div>
        </div>
      </div>
    </>
  );
}
