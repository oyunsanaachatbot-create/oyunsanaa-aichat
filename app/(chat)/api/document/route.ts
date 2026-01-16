import { auth } from "@/app/(auth)/auth";
import type { ArtifactKind } from "@/components/artifact";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

import { MENUS } from "@/config/menus";
import type { Document } from "@/lib/db/schema";

/**
 * Static "theory" doc-уудыг MENUS-аас олж
 * UI чинь хүлээдэг хэлбэрээр (Document[]) буцаана.
 *
 * id нь: "emotion/feel-now" гэх мэт байна.
 */
function getStaticDocumentsById(id: string): Document[] | null {
  const cleanId = (id || "").trim();

  for (const menu of MENUS) {
    for (const item of menu.items) {
      if (item.group !== "theory") continue;
      if (!item.artifact) continue;

      // menus.ts дээр theory item.href нь "emotion/feel-now" маягийн slug болсон байх ёстой
      if (item.href === cleanId) {
        const title = item.artifact.title ?? item.label;
        const content =
          item.artifact.content ??
          item.artifact.markdown ??
          item.artifact.body ??
          "";

        const now = new Date();

        // Document type-ийг тааруулахын тулд хамгийн хэрэгтэй талбаруудыг бөглөнө.
        // (schema нь арай өөр байвал TS дээр cast хийж байгаа.)
        const staticDoc = {
          id: cleanId,
          title,
          content,
          // schema чинь kind/userId шаарддаг байж магадгүй → placeholder
          kind: "text",
          userId: "static",
          createdAt: now,
        } as unknown as Document;

        return [staticDoc];
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is missing"
    ).toResponse();
  }

  // ✅ 1) Эхлээд MENUS static theory-оос хайна (DB рүү орохгүй)
  const staticDocs = getStaticDocumentsById(id);
  if (staticDocs) {
    return Response.json(staticDocs, { status: 200 });
  }

  // ✅ 2) Static биш бол хуучин шигээ DB document (login шаардана)
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

  return Response.json(documents, { status: 200 });
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

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("not_found:document").toResponse();
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

  return Response.json(document, { status: 200 });
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

  return Response.json(documentsDeleted, { status: 200 });
}
