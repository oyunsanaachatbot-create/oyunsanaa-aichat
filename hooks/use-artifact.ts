"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import type { UIArtifact } from "@/components/artifact";

export const initialArtifactData: UIArtifact = {
  documentId: "init",
  content: "",
  kind: "text",
  title: "",
  status: "idle",
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

type Selector<T> = (state: UIArtifact) => T;

export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
  const { data: localArtifact } = useSWR<UIArtifact>("artifact", null, {
    fallbackData: initialArtifactData,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const selectedValue = useMemo(() => {
    return selector(localArtifact ?? initialArtifactData);
  }, [localArtifact, selector]);

  return selectedValue;
}

export function useArtifact() {
  const { data: localArtifact, mutate: mutateArtifact } = useSWR<UIArtifact>(
    "artifact",
    null,
    {
      fallbackData: initialArtifactData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const artifact = useMemo(() => {
    return localArtifact ?? initialArtifactData;
  }, [localArtifact]);

  /**
   * Update local artifact state (NO revalidation)
   * - Accepts either a full artifact object OR an updater function.
   */
  const setArtifact = useCallback(
    (updater: UIArtifact | ((current: UIArtifact) => UIArtifact)) => {
      mutateArtifact(
        (current) => {
          const currentArtifact = current ?? initialArtifactData;
          return typeof updater === "function" ? updater(currentArtifact) : updater;
        },
        { revalidate: false }
      );
    },
    [mutateArtifact]
  );

  /**
   * Metadata is stored per-documentId, so different artifacts don't collide.
   */
  const metadataKey = useMemo(() => {
    const id = artifact.documentId;
    if (!id || id === "init") return null;
    return `artifact-metadata-${id}`;
  }, [artifact.documentId]);

  const { data: localMetadata, mutate: mutateMetadata } = useSWR<any>(
    metadataKey,
    null,
    {
      fallbackData: null,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  /**
   * Update local metadata state (NO revalidation)
   */
  const setMetadata = useCallback(
    (updater: any) => {
      mutateMetadata(updater, { revalidate: false });
    },
    [mutateMetadata]
  );

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      metadata: localMetadata,
      setMetadata,
    }),
    [artifact, setArtifact, localMetadata, setMetadata]
  );
}
