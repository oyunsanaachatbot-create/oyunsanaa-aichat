"use client";

import { useEffect, useMemo, useState } from "react";

type FormState = {
  mood: number;
  energy: number;
  stress: number;
  anxiety: number;
  sleep_quality: number;
  note: string;
};

export default function DailyCheckForm() {
  const [date, setDate] = useState(""); // ✅ эхлээд хоосон
  const [state, setState] = useState<FormState>({
    mood: 3,
    energy: 3,
    stress: 3,
    anxiety: 3,
    sleep_quality: 3,
    note: "",
  });

  // ✅ зөвхөн client дээр огноо set хийнэ
  useEffect(() => {
    const d = new Date();
    setDate(d.toISOString().slice(0, 10));
  }, []);

  // ... (үлдсэн код хэвээр)

  return (
    <div className="rounded-2xl border bg-white/5 backdrop-blur p-5 md:p-6 space-y-5">
      {/* date input */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border bg-transparent px-3 py-2 text-sm"
      />
      {/* ... */}
    </div>
  );
}
