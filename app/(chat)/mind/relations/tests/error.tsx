"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Relations tests route error:", error);
  }, [error]);

  return (
    <div style={{ padding: 16, color: "white" }}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>Тестүүд дээр алдаа гарлаа</div>
      <div style={{ opacity: 0.85, marginTop: 8 }}>
        Доорх мессежийг надад явуулбал яг оношлоод 1 мөрөөр засна:
      </div>

      <pre
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
{String(error?.message || error)}
{"\n\n"}
{error?.stack || ""}
      </pre>

      <button
        onClick={() => reset()}
        style={{
          marginTop: 12,
          height: 44,
          padding: "0 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.10)",
          color: "white",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Дахин оролдох
      </button>
    </div>
  );
}
