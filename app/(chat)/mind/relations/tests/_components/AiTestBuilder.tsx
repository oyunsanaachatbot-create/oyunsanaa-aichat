"use client";

import { LoaderCircle, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import type { TestDefinition } from "@/lib/apps/relations/tests/types";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function AiTestBuilder({
  onCreated,
}: {
  onCreated: (test: TestDefinition) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ямар сэдэв, зорилгоор өөртөө зориулсан тест үүсгэмээр байна вэ? Жишээ нь: ажлын стресс, харилцааны хил хязгаар, өөртөө итгэх итгэл.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/relations/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await response.json()) as {
        assistantMessage?: string;
        test?: TestDefinition;
      };
      if (!response.ok || !data.test || !data.assistantMessage) {
        throw new Error("generation_failed");
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.assistantMessage ?? "" },
      ]);
      onCreated(data.test);
    } catch {
      setError("Тест үүсгэх үед алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[20px] border border-violet-200 bg-violet-50/50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
          <MessageCircle className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-lg text-slate-900">
            Чатаар өөртөө тест үүсгэх
          </h2>
          <p className="mt-1 text-slate-600 text-sm leading-relaxed">
            Сэдвээ бичээрэй. AI таны хүсэлд тохирсон тестийг одоогийн асуулт,
            хариултын форматаар үүсгэж, зөвхөн таны бүртгэлд хадгална.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-violet-100 bg-white p-3">
        {messages.map((message, index) => (
          <div
            className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === "user"
                ? "bg-violet-100 text-violet-950 sm:ml-8"
                : "bg-slate-100 text-slate-700 sm:mr-8"
            }`}
            key={`${message.role}-${index}`}
          >
            {message.content}
          </div>
        ))}
        {error && <p className="px-1 text-red-600 text-xs">{error}</p>}
        <div className="flex items-center gap-2 pt-1">
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send().catch(() => null);
            }}
            placeholder="Жишээ: ажлын стрессээ ойлгох тест"
            value={input}
          />
          <button
            aria-label="Тест үүсгэх"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || !input.trim()}
            onClick={() => send().catch(() => null)}
            type="button"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
