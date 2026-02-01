"use client";

import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 2px",
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        style={{
          height: 40,
          padding: "0 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.92)",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        ← Буцах
      </button>

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={() => router.push("/")}
        style={{
          height: 40,
          padding: "0 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.92)",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Чат
      </button>
    </div>
  );
}
