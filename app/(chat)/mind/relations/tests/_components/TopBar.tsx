"use client";

import { useRouter } from "next/navigation";

const EXIT_HREF = "/mind/relations"; // хүсвэл өөр route болгож болно

export default function TopBar() {
  const router = useRouter();

  function handleBack() {
    // cancelable event: TestRunner барьж аваад preventDefault() хийж чадна
    const ev = new CustomEvent("relations-tests-back", { cancelable: true });
    const notCanceled = window.dispatchEvent(ev);

    // Хэрвээ TestRunner бариагүй (idx==0 гэх мэт) -> хуудсаас гарна
    if (notCanceled) router.push(EXIT_HREF);
  }

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

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={() => router.push("/")}
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
