import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getEbookNotes, replaceEbookNotes } from "@/lib/db/queries";

const sectionIdSchema = z.string().trim().min(1).max(40);

const noteSchema = z.object({
  clientId: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(240),
  content: z.string().max(100_000).default(""),
  includeInBook: z.boolean().default(true),
  templateId: z.string().trim().min(1).max(48).default("paper-white"),
  imageUrl: z.string().max(2_000_000).default(""),
  imageCaption: z.string().max(2000).default(""),
  imageAspect: z.string().max(24).default(""),
  createdAt: z.string().datetime().optional(),
});

const replaceSchema = z.object({
  sectionId: sectionIdSchema,
  notes: z.array(noteSchema).max(200),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function toClientNote(note: Awaited<ReturnType<typeof getEbookNotes>>[number]) {
  return {
    id: note.clientId,
    title: note.title,
    content: note.content,
    includeInBook: note.includeInBook,
    templateId: note.templateId,
    imageUrl: note.imageUrl,
    imageCaption: note.imageCaption,
    imageAspect: note.imageAspect,
    createdAt: note.noteCreatedAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    sectionId: note.sectionId,
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return unauthorized();
  }

  const rawSectionId = new URL(request.url).searchParams.get("sectionId");
  const parsedSectionId = rawSectionId
    ? sectionIdSchema.safeParse(rawSectionId)
    : null;
  if (parsedSectionId && !parsedSectionId.success) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const notes = await getEbookNotes({
    userId: session.user.id,
    sectionId: parsedSectionId?.data,
  });

  return NextResponse.json({ notes: notes.map(toClientNote) });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = replaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid notes payload" },
      { status: 400 }
    );
  }

  const notes = await replaceEbookNotes({
    userId: session.user.id,
    sectionId: parsed.data.sectionId,
    notes: parsed.data.notes.map((note) => ({
      clientId: note.clientId,
      title: note.title,
      content: note.content,
      includeInBook: note.includeInBook,
      templateId: note.templateId,
      imageUrl: note.imageUrl,
      imageCaption: note.imageCaption,
      imageAspect: note.imageAspect,
      noteCreatedAt: note.createdAt ? new Date(note.createdAt) : new Date(),
    })),
  });

  return NextResponse.json({ notes: notes.map(toClientNote) });
}
