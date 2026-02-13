import { NextRequest } from "next/server";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type TransactionType = "income" | "expense";
type CategoryId = "food" | "transport" | "clothes" | "home" | "fun" | "health" | "other";

type FinanceDraft = {
  date: string;          // yyyy-mm-dd
  amount: number;        // дүн
  type: TransactionType; // "income" | "expense"
  category: CategoryId;  // ангилал
  note: string;          // тайлбар
};

type FinanceResponse = { list: FinanceDraft[] };

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "missing_openai_key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: "file_not_found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mime = (file as File).type || "application/octet-stream";

    // (сонголт) audio-г одоохондоо дэмжихгүй
    if (mime.startsWith("audio/")) {
      return new Response(JSON.stringify({ error: "audio_not_supported_yet" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // image -> base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    const prompt =
      `Та санхүүгийн баримт (receipt) уншаад гүйлгээний мэдээллийг JSON болгож гарга.\n` +
      `Зөвхөн дараах structure-тэй JSON буцаа:\n\n` +
      `{\n` +
      `  "list": [\n` +
      `    {\n` +
      `      "date": "2025-12-07",\n` +
      `      "amount": 5400,\n` +
      `      "type": "expense",\n` +
      `      "category": "food",\n` +
      `      "note": "талх, сүү"\n` +
      `    }\n` +
      `  ]\n` +
      `}\n\n` +
      `✦ date нь yyyy-mm-dd форматтай.\n` +
      `✦ type нь зөвхөн "income" эсвэл "expense".\n` +
      `✦ category нь: "food" | "transport" | "clothes" | "home" | "fun" | "health" | "other".\n` +
      `✦ note дээр барааны нэр, товч тайлбар бич.\n` +
      `Зөвхөн цэвэр JSON буцаа.`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return new Response(JSON.stringify({ error: "openai_failed", detail: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: any = await openaiRes.json();
    const rawText: string = data?.output?.[0]?.content?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(JSON.stringify({ error: "empty_output", raw: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsed: FinanceResponse;
    try {
      parsed = JSON.parse(rawText) as FinanceResponse;
    } catch {
      return new Response(JSON.stringify({ error: "bad_json", raw: rawText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const safeDrafts = (parsed.list || []).map((item) => ({
      date: item.date || "",
      amount: Number(item.amount) || 0,
      type: item.type === "income" ? "income" : "expense",
      category: ((item.category || "other") as CategoryId),
      note: item.note || "",
    }));

    // ✅ FinanceCapturePanel чинь payload.drafts гэж уншдаг тул ингэж буцаана
    return new Response(JSON.stringify({ drafts: safeDrafts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
