"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

const CHAT_HREF = "/"; // Чиний chat өөр замтай бол энд л ганц удаа солино

export default function TopBar() {
  const router = useRouter();
  const t = useT();

  function handleBack() {
    // TestRunner event барьж авбал route солихгүй
    const ev = new CustomEvent("relations-tests-back", { cancelable: true });
    const notCanceled = window.dispatchEvent(ev);

    // TestRunner байхгүй үед л fallback
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
        ← {t.apps.relationsTests.back}
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
        {t.apps.relationsTests.chat}
      </button>
    </div>
  );
}
