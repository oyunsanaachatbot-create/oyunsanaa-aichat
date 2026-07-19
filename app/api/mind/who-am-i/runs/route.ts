import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  completeWhoAmIProgramRun,
  getWhoAmIProgramRuns,
  saveWhoAmIProgramDraft,
} from "@/lib/db/queries";

const percentages = z
  .object({
    body: z.number().int().min(0).max(100),
    work: z.number().int().min(0).max(100),
    bond: z.number().int().min(0).max(100),
    meaning: z.number().int().min(0).max(100),
  })
  .strict();

const payload = z.object({
  screen: z
    .enum([
      "area",
      "test",
      "balance-result",
      "observe",
      "capacity-intro",
      "capacities",
      "capacity-result",
      "future",
      "summary",
    ])
    .default("area"),
  areaIdx: z.number().int().min(0).max(3),
  pct: percentages,
  notes: z.record(z.string(), z.string().max(10_000)),
  answers: z.record(z.string().max(120), z.string().max(10_000)),
  scores: z.record(z.string().max(120), z.number().int().min(0).max(10)),
  finalNote: z.string().max(10_000),
});

const requestSchema = z.object({
  id: z.string().uuid().optional(),
  mode: z.enum(["draft", "complete"]),
  payload,
});

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  try {
    return NextResponse.json(await getWhoAmIProgramRuns(userId));
  } catch {
    return NextResponse.json({ error: "result_load_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_result" }, { status: 400 });
  }

  const { id, mode, payload: data } = parsed.data;
  if (
    mode === "complete" &&
    data.pct.body + data.pct.work + data.pct.bond + data.pct.meaning !== 100
  ) {
    return NextResponse.json(
      { error: "invalid_balance_total" },
      { status: 400 }
    );
  }

  try {
    const run =
      mode === "complete"
        ? await completeWhoAmIProgramRun({ id, payload: data, userId })
        : await saveWhoAmIProgramDraft({ id, payload: data, userId });
    return NextResponse.json({ run });
  } catch {
    return NextResponse.json({ error: "result_save_failed" }, { status: 500 });
  }
}
