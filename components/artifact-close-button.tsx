"use client";

import { memo, type MouseEvent, type PointerEvent } from "react";

import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { CrossIcon } from "./icons";
import { Button } from "./ui/button";

function PureArtifactCloseButton() {
  const { setArtifact } = useArtifact();

  const close = (e: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ 100% reset (static / init / streaming бүгдэд ажиллана)
    setArtifact(() => ({
      ...initialArtifactData,
      documentId: "init",
      status: "idle",
      isVisible: false,
    }));

    // ✅ зарим үед үлдсэн scroll-lock / pointer lock-ийг цэвэрлэнэ
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    }
  };

  return (
    <Button
      className="h-fit p-2 dark:hover:bg-zinc-700"
      data-testid="artifact-close-button"
      variant="outline"
      type="button"
      onPointerDown={close}
      onClick={close}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
