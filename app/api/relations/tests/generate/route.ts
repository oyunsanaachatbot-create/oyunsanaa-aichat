import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { createAIGeneratedTest, getAIGeneratedTests } from "@/lib/db/queries";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

const generatedTestSchema = z.object({
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(1000),
  questions: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        text: z.string().trim().min(5).max(500),
        options: z
          .array(
            z.object({
              label: z.string().trim().min(1).max(160),
              value: z.number().int().min(0).max(4),
            })
          )
          .length(5),
      })
    )
    .min(5)
    .max(12),
  bands: z
    .array(
      z.object({
        minPct: z.number().min(0).max(1),
        title: z.string().trim().min(1).max(160),
        summary: z.string().trim().min(1).max(1000),
        tips: z.array(z.string().trim().min(1).max(300)).max(5),
      })
    )
    .min(3)
    .max(5),
});

type GeneratedTest = z.infer<typeof generatedTestSchema>;

function toClientTest(row: {
  id: string;
  title: string;
  description: string;
  definition: unknown;
}) {
  const definition = generatedTestSchema.parse(row.definition);
  return {
    id: row.id,
    slug: `ai-${row.id}`,
    title: row.title,
    description: row.description,
    questions: definition.questions,
    bands: definition.bands,
  } satisfies GeneratedTest & {
    id: string;
    slug: string;
  };
}

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await getAIGeneratedTests(userId);
    return NextResponse.json({ tests: rows.map(toClientTest) });
  } catch {
    return NextResponse.json({ error: "test_load_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ messages: z.array(messageSchema).min(1).max(12) })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_messages" }, { status: 400 });
  }

  const transcript = parsed.data.messages
    .map(
      (message) =>
        `${message.role === "user" ? "Хэрэглэгч" : "Оюунсанаа"}: ${message.content}`
    )
    .join("\n");

  try {
    const { object } = await generateObject({
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      schema: generatedTestSchema,
      prompt: `
Чи Оюунсанаагийн сэтгэлзүйн өөрийгөө ажиглах тест зохиогч байна.
Доорх харилцан ярианд үндэслэн тухайн хэрэглэгчид зориулсан нэг тест үүсгэ.
Тест нь эмнэлгийн оношилгоо биш, өөрийгөө ажиглах зорилготой байна.
Бүх гаргалтыг монгол хэлээр бич.

Шаардлага:
- 5–12 тодорхой, давхар утгагүй асуулттай байна.
- Асуулт бүр яг 5 сонголттой, value нь 0, 1, 2, 3, 4 дарааллаар байна.
- bands нь нийт онооны хувьд 0.0-оос 1.0 хүртэл өсөх minPct-тай байна.
- Үр дүнгийн тайлбар, зөвлөмж нь буруутгахгүй, аюулгүй хэллэгтэй байна.

Харилцан яриа:
${transcript}
      `.trim(),
    });

    const created = await createAIGeneratedTest({
      userId,
      title: object.title,
      description: object.description,
      definition: object,
    });

    return NextResponse.json({
      assistantMessage: `“${object.title}” тестийг зөвхөн танд зориулж үүсгээд хадгаллаа. Одоо бөглөж болно.`,
      test: toClientTest(created),
    });
  } catch {
    return NextResponse.json(
      { error: "test_generation_failed" },
      { status: 500 }
    );
  }
}
