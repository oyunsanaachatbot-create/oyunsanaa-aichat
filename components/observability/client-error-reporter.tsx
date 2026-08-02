"use client";

import { useEffect } from "react";

const recentErrors = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30_000;

function report(payload: Record<string, unknown>) {
  const message = String(payload.message ?? "Unknown client error").slice(
    0,
    500
  );
  const key = `${payload.kind}:${message}`;
  const now = Date.now();
  if (now - (recentErrors.get(key) ?? 0) < DEDUPE_WINDOW_MS) return;
  recentErrors.set(key, now);

  fetch("/api/observability/client-error", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      message,
      path: window.location.pathname,
    }),
    keepalive: true,
  }).catch(() => {
    // Error reporting itself must never create another user-visible error.
  });
}

export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report({
        kind: "window_error",
        message: event.message || event.error?.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      report({
        kind: "unhandled_rejection",
        message:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason ?? "Unhandled promise rejection"),
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
  return null;
}
