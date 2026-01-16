import { auth } from "@/app/(auth)/auth";
import type { ArtifactKind } from "@/components/artifact";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { MENUS } from "@/config/menus";

// -----------------------------
// Static (theory) document lookup
// id: "emotion/feel-now" гэх мэт
// -----------------------------
function getStaticDocById(id: string) {
  const cleanId = (id || "").trim();

  for (const menu of MENUS) {
    for (const item of menu.items) {
      if (item.group !== "theory") continue;
      if (!item.artifact) continue;

      // menus.ts дээр бид theory item.href-ийг slug ("emotion/feel-now") болгосон
      if (item.href === cleanId) {
        const title = item.artifact.title ?? item.label;
        const content =
          item.artifact.content ??
          item.artifact.markdown ??
          item.artifact.body ??
          "";

        return {
          id: cleanId,
          title,
          content,
          // таны ArtifactKind шаарддаг бол энд default өгч болно
          kind: "document" as ArtifactKind,
          // static бол userId байхгүй — доор GET дээр permissions-ийг алгасна
        };
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

  // ✅ 1) Эхлээд static theory-оос хайна (DB query хийхгүй)
  const staticDoc = getStaticDocById(id);
  if (staticDoc) {
    // Онол (static) контент бол login шаардахгүйгээр үзүүлж болно.
    // Хэрвээ заавал login шаардана гэвэл доорх auth check-ийг статик дээр ч хийж болно.
    return Response.json(staticDoc, { status: 200 });
  }

  // ✅ 2) Static биш бол DB document (хуучин логик хэвээр)
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

  if (document.userId !== session.user.id) {
    return new ChatSDKError("forbidden:document").toResponse();
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return Response.json(documentsDeleted, { status: 200 });
}
