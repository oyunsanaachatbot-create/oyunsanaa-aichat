"use client";

import { memo } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { CrossIcon } from "./icons";
import { Button } from "./ui/button";

function PureArtifactCloseButton() {
  const { setArtifact } = useArtifact();

  return (
    <Button
      className="h-fit p-2 dark:hover:bg-zinc-700"
      data-testid="artifact-close-button"
      variant="outline"
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // ✅ 100% reset
        setArtifact({
          ...initialArtifactData,
          documentId: "init",
          status: "idle",
          isVisible: false,
        });

        // ✅ overlay/scroll lock үлдвэл арилгана
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
      }}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
