import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { MENUS } from "@/config/menus";
import type { ArtifactKind } from "@/components/artifact";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * Static MENUS artifact lookup
 * UI calls: /api/document?id=<SOME_ID>
 * We support BOTH:
 *  - Static artifacts defined in MENUS (no DB)
 *  - DB documents saved in documents table (Drizzle queries)
 */
function findStaticArtifactById(id: string) {
  const cleanId = (id || "").trim();

  for (const menu of MENUS) {
    for (const item of menu.items) {
      // only items that actually have artifact
      if (!("artifact" in item) || !item.artifact) continue;

      // Accept both styles:
      // 1) item.href is "purpose/quick-understand" (no leading slash)
      // 2) item.href is "/mind/..." (route) -> NOT used as document id
      if (item.href === cleanId) {
        const title =
          (item.artifact as any)?.title ?? item.label ?? "Untitled";
        const content =
          (item.artifact as any)?.content ?? "";

        return [
          {
            id: cleanId,
            userId: "static",
            title,
            kind: "text" as ArtifactKind,
            content,
            createdAt: new Date().toISOString(),
          },
        ];
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new ChatSDKError(
        "bad_request:api",
        "Parameter id is missing"
      ).toResponse();
    }

    // 1) Serve static artifacts first (MENUS)
    const staticDocs = findStaticArtifactById(id);
    if (staticDocs) {
      return NextResponse.json(staticDocs, { status: 200 });
    }

    // 2) Otherwise, fall back to DB documents
    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError("unauthorized:document").toResponse();
    }

    const documents = await getDocumentsById({ id });
    const [document] = documents;

    if (!document) {
      return new ChatSDKError("not_found:document").toResponse();
    }

    if (document.userId !== session.user.id) {
      return new ChatSDKError("forbidden:document").toResponse();
    }

    return NextResponse.json(documents, { status: 200 });
  } catch (e) {
    // Keep response consistent with your existing error system
    return new ChatSDKError("offline:document").toResponse();
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  // Do NOT allow writing to static MENUS artifacts
  const staticDocs = findStaticArtifactById(id);
  if (staticDocs) {
    return new ChatSDKError(
      "bad_request:api",
      "Static menu artifacts cannot be edited."
    ).toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  const documents = await getDocumentsById({ id });
  if (documents.length > 0) {
    const [doc] = documents;
    if (doc.userId !== session.user.id) {
      return new ChatSDKError("forbidden:document").toResponse();
    }
  }

  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return NextResponse.json(document, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const timestamp = searchParams.get("timestamp");

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  if (!timestamp) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter timestamp is required."
    ).toResponse();
  }

  // Do NOT allow deleting static MENUS artifacts
  const staticDocs = findStaticArtifactById(id);
  if (staticDocs) {
    return new ChatSDKError(
      "bad_request:api",
      "Static menu artifacts cannot be deleted."
    ).toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const documents = await getDocumentsById({ id });
  const [document] = documents;

  if (!document) {
    return new ChatSDKError("not_found:document").toResponse();
  }

  if (document.userId !== session.user.id) {
    return new ChatSDKError("forbidden:document").toResponse();
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return NextResponse.json(documentsDeleted, { status: 200 });
}
