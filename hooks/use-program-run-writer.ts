"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProgramRunWriter, type RunWrite } from "@/lib/programs/run-writer";

export function useProgramRunWriter(
  slug: string,
  runId: string | undefined,
  revision: number | undefined
) {
  // Revision evolves inside the queue, not from an older render's payload.
  const writer = useMemo(
    () =>
      runId
        ? new ProgramRunWriter(
            `/api/mind/programs/${encodeURIComponent(slug)}/run`,
            revision ?? 0
          )
        : null,
    [slug, runId, revision]
  );
  const pending = useRef<RunWrite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const latestGeneration = useRef(0);
  const write = useCallback(
    async (payload: RunWrite) => {
      pending.current = payload;
      const generation = ++latestGeneration.current;
      setDirty(true);
      try {
        const result = await writer?.write(payload);
        if (generation === latestGeneration.current) {
          pending.current = null;
          setDirty(false);
          setError(null);
        }
        return result;
      } catch (failure) {
        setError(
          failure instanceof Error &&
            failure.message === "run_revision_conflict"
            ? "Өөр цонхонд явц өөрчлөгдсөн. Бичсэнээ хуулж аваад хуудсыг дахин ачаална уу."
            : "Хадгалж чадсангүй. Сүлжээгээ шалгаад дахин оролдоно уу."
        );
        throw failure;
      }
    },
    [writer]
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pending UI when the run writer changes.
  useEffect(() => {
    pending.current = null;
    latestGeneration.current++;
    setError(null);
    setDirty(false);
  }, [writer]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);
  return {
    write,
    error,
    dirty,
    retry: () =>
      pending.current ? write(pending.current) : Promise.resolve(null),
  };
}
