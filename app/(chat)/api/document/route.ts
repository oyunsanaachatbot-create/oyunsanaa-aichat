import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import type { ArtifactKind } from "@/components/artifact";
import { MENUS } from "@/config/menus";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * MENUS дээрх item.artifact (title/content)-ийг DB ашиглахгүйгээр буцаана.
 * UI: /api/document?id=emotion/feel-now  гэж дууддаг.
 * MENUS дээр item.href нь "emotion/feel-now" гэх мэт байх ёстой.
 */
function findStaticMenuArtifactById(id: string) {
  const cleanId = (id || "").trim();

  for (const menu of MENUS) {
    for (const item of menu.items) {
      // зөвхөн artifact-тай зүйл
      if (!item.artifact) continue;

      // item.href нь "emotion/feel-now" хэлбэртэй байгаа (танай зураг дээр тийм байна)
      if ((item.href || "").trim() === cleanId) {
        return [
          {
            id: cleanId,
            userId: "static",
            title: item.artifact.title ?? item.label,
            kind: "text" as const,
            content: item.artifact.content ?? "",
            createdAt: new Date(),
          },
        ];
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return new ChatSDKError("bad_request:api", "Parameter id is missing").toResponse();
  }

  // ✅ 1) Эхлээд MENUS дээрээс static artifact байвал DB-гүй буцаана
  const staticDocs = findStaticMenuArtifactById(id);
  if (staticDocs) {
    return NextResponse.json(staticDocs, { status: 200 });
  }

  // ✅ 2) Static биш бол хуучин шиг DB document (auth шаардлагатай)
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
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return new ChatSDKError("bad_request:api", "Parameter id is required.").toResponse();
  }

  // 🚫 MENUS static зүйл рүү POST хийхгүй (онолын зүйл DB-д хадгалах шаардлагагүй)
  const staticDocs = findStaticMenuArtifactById(id);
  if (staticDocs) {
    return new ChatSDKError("bad_request:api", "Static menu artifacts cannot be saved.").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const { content, title, kind }: { content: string; title: string; kind: ArtifactKind } =
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
  const id = searchParams.get("id")?.trim();
  const timestamp = searchParams.get("timestamp");

  if (!id) {
    return new ChatSDKError("bad_request:api", "Parameter id is required.").toResponse();
  }

  if (!timestamp) {
    return new ChatSDKError("bad_request:api", "Parameter timestamp is required.").toResponse();
  }

  // 🚫 Static menu artifact устгахгүй
  const staticDocs = findStaticMenuArtifactById(id);
  if (staticDocs) {
    return new ChatSDKError("bad_request:api", "Static menu artifacts cannot be deleted.").toResponse();
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
