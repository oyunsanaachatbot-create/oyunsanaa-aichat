import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function buildResult(a: any) {
  const weekly = (a?.weekly_3 ?? "")
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map((s: string) => (s.startsWith("-") ? s : `- ${s}`))
    .slice(0, 3);

  const title = "Миний зорилгын зураг (Oyunsanaa цэгцэлсэн)";
  const content = [
    `## Утга (Яагаад?)`,
    `- ${a?.why ?? "(хоосон)"}`,

    `\n## Урт хугацаа (5–10 жил)`,
    `- ${a?.vision_5_10y ?? "(хоосон)"}`,

    `\n## Дунд хугацаа (1 жил)`,
    `- ${a?.year_goal ?? "(хоосон)"}`,

    `\n## Богино хугацаа (12 долоо хоног)`,
    `- ${a?.focus_12w ?? "(хоосон)"}`,

    `\n## Энэ долоо хоногийн 3 алхам`,
    ...(weekly.length ? weekly : ["- (хоосон)"]),

    `\n## Өнөөдрийн 1 алхам`,
    `- ${a?.daily_action ?? "(хоосон)"}`,
    a?.daily_minutes ? `- Хугацаа: ${a.daily_minutes}` : ``,
  ].join("\n");

  return { title, content, meta: { weekly_steps: weekly, daily_minutes: a?.daily_minutes ?? "" } };
}

export async function POST(req: Request) {
  try {
    const { userId, inputId } = await req.json();
    if (!userId || !inputId) return NextResponse.json({ error: "Missing userId/inputId" }, { status: 400 });

    const sb = supabaseAdmin();
    const { data: input, error: e1 } = await sb
      .from("goal_inputs")
      .select("id, answers")
      .eq("id", inputId)
      .eq("user_id", userId)
      .single();

    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    const result = buildResult(input.answers);

    const { data: out, error: e2 } = await sb
      .from("goal_outputs")
      .insert([{ user_id: userId, input_id: input.id, title: result.title, content: result.content, meta: result.meta }])
      .select("id, title, content, created_at")
      .single();

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    return NextResponse.json({ ok: true, output: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
