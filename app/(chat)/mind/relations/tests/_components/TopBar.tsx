"use client";

import { useRouter } from "next/navigation";

const CHAT_HREF = "/"; // чиний chat зам өөр бол энд солино

export default function TopBar() {
  const router = useRouter();

  function handleBack() {
    // TestRunner энэ event-ийг барьж авч чадвал route солихгүй
    const ev = new CustomEvent("relations-tests-back", { cancelable: true });
    const notCanceled = window.dispatchEvent(ev);

    // Хэрвээ TestRunner барьж авч чадаагүй (ховор) үед л safe fallback
    if (notCanceled) {
      router.push("/mind/relations/tests"); // 404 биш route
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 2px",
      }}
    >
      <button
        type="button"
        onClick={handleBack}
        style={{
          height: 40,
          padding: "0 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.95)",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        ← Буцах
      </button>

      <button
        type="button"
        onClick={() => router.push(CHAT_HREF)}
        style={{
          height: 40,
          padding: "0 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.95)",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Чат
      </button>
    </div>
  );
}
