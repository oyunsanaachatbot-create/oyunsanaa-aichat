import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import type { ArtifactKind } from "@/components/artifact";
import { getDocumentsById, saveDocument, deleteDocumentsByIdAfterTimestamp } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * GET /api/document?id=...
 * - DB дээрх document versions-ийг буцаана
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return new ChatSDKError("bad_request:api", "Parameter id is missing").toResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError("unauthorized:document").toResponse();
    }

    const documents = await getDocumentsById({ id });

    if (!documents || documents.length === 0) {
      return new ChatSDKError("not_found:document").toResponse();
    }

    // owner check (хамгийн эхний хувилбар дээр шалгахад хангалттай)
    const [first] = documents;
    if (first.userId !== session.user.id) {
      return new ChatSDKError("forbidden:document").toResponse();
    }

    return NextResponse.json(documents, { status: 200 });
  } catch (e) {
    console.error("DOCUMENT_GET_ERROR", e);
    return new ChatSDKError("offline:document").toResponse();
  }
}

/**
 * POST /api/document?id=...
 * body: { title, content, kind }
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return new ChatSDKError("bad_request:api", "Parameter id is required.").toResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError("unauthorized:document").toResponse();
    }

    const body = await request.json();
    const content = String(body?.content ?? "");
    const title = String(body?.title ?? "Untitled");
    const kind = body?.kind as ArtifactKind;

    if (!kind) {
      return new ChatSDKError("bad_request:api", "Parameter kind is required.").toResponse();
    }

    // existing owner check if exists
    const existing = await getDocumentsById({ id });
    if (existing?.length) {
      const [doc] = existing;
      if (doc.userId !== session.user.id) {
        return new ChatSDKError("forbidden:document").toResponse();
      }
    }

    const saved = await saveDocument({
      id,
      content,
      title,
      kind,
      userId: session.user.id,
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (e) {
    console.error("DOCUMENT_POST_ERROR", e);
    return new ChatSDKError("offline:document").toResponse();
  }
}

/**
 * DELETE /api/document?id=...&timestamp=...
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") || "").trim();
    const timestamp = (searchParams.get("timestamp") || "").trim();

    if (!id) {
      return new ChatSDKError("bad_request:api", "Parameter id is required.").toResponse();
    }
    if (!timestamp) {
      return new ChatSDKError("bad_request:api", "Parameter timestamp is required.").toResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError("unauthorized:document").toResponse();
    }

    const documents = await getDocumentsById({ id });
    if (!documents || documents.length === 0) {
      return new ChatSDKError("not_found:document").toResponse();
    }

    const [doc] = documents;
    if (doc.userId !== session.user.id) {
      return new ChatSDKError("forbidden:document").toResponse();
    }

    const deleted = await deleteDocumentsByIdAfterTimestamp({
      id,
      timestamp: new Date(timestamp),
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (e) {
    console.error("DOCUMENT_DELETE_ERROR", e);
    return new ChatSDKError("offline:document").toResponse();
  }
}
