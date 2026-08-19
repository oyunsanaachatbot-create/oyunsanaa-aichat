import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  completeProgramRun,
  getActiveProgramRunBySlug,
  getOrCreateProgramRun,
  getProgramIdentityBySlug,
  getPublishedProgramBySlug,
  saveProgramRun,
} from "@/lib/db/queries";
import type { ProgramResponses } from "@/lib/programs/definition";
import { recordContentUsage } from "@/lib/taxonomy/recommendations";

const responseValueSchema = z.union([
  z.string().max(10_000),
  z.number().finite(),
  z.array(z.string().max(120)).max(100),
  z.boolean(),
]);

const saveSchema = z.object({
  mode: z.enum(["DRAFT", "COMPLETE"]),
  runId: z.string().uuid(),
  currentSectionId: z.string().min(1).max(64),
  responses: z.record(z.string().max(200), responseValueSchema),
});

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

async function bodyAsJson(request: Request) {
  const body = await request.text();
  if (body.length > 1_000_000) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const { slug } = await params;
  const active = await getActiveProgramRunBySlug({ slug, userId });
  if (active) {
    await recordContentUsage({
      sourceId: active.run.programId,
      state: "STARTED",
      userId,
    }).catch(() => {
      // Usage tracking must never block loading a program.
    });
    return NextResponse.json(active, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  const publishedProgram = await getPublishedProgramBySlug(slug);
  if (!publishedProgram) {
    return NextResponse.json({ error: "program_not_found" }, { status: 404 });
  }
  if (publishedProgram.renderer !== "BUILDER") {
    return NextResponse.json({ error: "legacy_program" }, { status: 409 });
  }

  try {
    const data = await getOrCreateProgramRun({ publishedProgram, userId });
    await recordContentUsage({
      sourceId: publishedProgram.id,
      state: "STARTED",
      userId,
    }).catch(() => {
      // Usage tracking must never block loading a program.
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "run_load_failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const parsed = saveSchema.safeParse(await bodyAsJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_run" }, { status: 400 });
  }

  const { slug } = await params;
  const program = await getProgramIdentityBySlug(slug);
  if (!program || program.renderer !== "BUILDER") {
    return NextResponse.json({ error: "program_not_found" }, { status: 404 });
  }

  const { currentSectionId, mode, responses, runId } = parsed.data;
  try {
    if (mode === "DRAFT") {
      const saved = await saveProgramRun({
        currentSectionId,
        id: runId,
        programId: program.id,
        responses: responses as ProgramResponses,
        userId,
      });
      if (!saved) {
        return NextResponse.json({ error: "run_not_found" }, { status: 404 });
      }
      return NextResponse.json({ run: saved.run });
    }

    const completed = await completeProgramRun({
      id: runId,
      programId: program.id,
      responses: responses as ProgramResponses,
      userId,
    });
    if (!completed) {
      return NextResponse.json({ error: "run_not_found" }, { status: 404 });
    }
    if (completed.status === "MISSING") {
      return NextResponse.json(
        { error: "required_answers_missing", missing: completed.missing },
        { status: 400 }
      );
    }
    await recordContentUsage({
      completed: true,
      sourceId: program.id,
      state: "COMPLETED",
      userId,
    }).catch(() => {
      // Completion remains valid if analytics storage is unavailable.
    });
    return NextResponse.json({ run: completed.run, result: completed.result });
  } catch {
    return NextResponse.json({ error: "run_save_failed" }, { status: 500 });
  }
}
