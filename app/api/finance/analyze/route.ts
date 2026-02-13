import { NextRequest } from "next/server";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type TransactionType = "income" | "expense";
type CategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

export type FinanceDraft = {
  date: string;          // yyyy-mm-dd
  amount: number;        // дүн
  type: TransactionType; // "income" | "expense"
  category: CategoryId;  // ангилал
  note: string;          // тайлбар
};

type FinanceResponse = {
  list: FinanceDraft[];
};

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

    // (Optional) voice pipeline хийгээгүй бол түр хязгаарлая
    if (mime.startsWith("audio/")) {
      return new Response(JSON.stringify({ error: "audio_not_supported_yet" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!mime.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "unsupported_file_type", mime }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔹 Зургийг base64 болгож data URL үүсгэнэ
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    // 🔹 Prompt
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
      `✦ date нь yyyy-mm-dd форматтай байг.\n` +
      `✦ type нь зөвхөн "income" эсвэл "expense".\n` +
      `✦ category нь: "food" | "transport" | "clothes" | "home" | "fun" | "health" | "other".\n` +
      `✦ note дээр барааны нэр, товч тайлбар бич.\n`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        // ✅ JSON mode (structured output)
        text: { format: { type: "json_object" } }, // :contentReference[oaicite:3]{index=3}
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
      console.error("OpenAI error:", openaiRes.status, text);
      return new Response(JSON.stringify({ error: "openai_failed", detail: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: any = await openaiRes.json();

    // ✅ Илүү найдвартай: output_text ашиглах (байхгүй бол fallback)
    const rawText: string =
      data?.output_text ??
      data?.output?.find((x: any) => x?.content?.some((c: any) => c?.type === "output_text"))
        ?.content?.find((c: any) => c?.type === "output_text")?.text ??
      data?.output?.[0]?.content?.[0]?.text ??
      "";

    if (!rawText) {
      console.error("Empty output from OpenAI:", data);
      return new Response(JSON.stringify({ error: "empty_output", raw: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsed: FinanceResponse;
    try {
      parsed = JSON.parse(rawText) as FinanceResponse;
    } catch (e) {
      console.error("JSON parse error:", e, rawText);
      return new Response(JSON.stringify({ error: "bad_json", raw: rawText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const safeList = (parsed.list || []).map((item) => ({
      date: item.date || "",
      amount: Number(item.amount) || 0,
      type: item.type === "income" ? "income" : "expense",
      category: ((item.category || "other") as CategoryId),
      note: item.note || "",
    }));

    // ✅ PANEL-тэй тааруулах response shape
    return new Response(JSON.stringify({ drafts: safeList }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Finance analyze route error:", error);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
