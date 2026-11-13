"use client";

import { useEffect } from "react";

export function ContentUsageTracker({
  externalKey,
}: {
  externalKey: string | null;
}) {
  useEffect(() => {
    if (!externalKey) return;
    fetch("/api/content/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalKey, state: "VIEWED" }),
      keepalive: true,
    }).catch(() => {
      // Recommendation history is best-effort and must not affect navigation.
    });
  }, [externalKey]);
  return null;
}
