import { NextResponse } from "next/server";
import { MENUS } from "@/config/menus";
import { ChatSDKError } from "@/lib/errors";

/**
 * UI чинь `/api/document?id=...` гэж дууддаг.
 * Харин чиний MENUS дээр item.href нь бүрэн route ("/mind/...") байгаа.
 * Тиймээс id-г яг тэр route-оор нь тааруулж MENUS-оос уншина.
 */
function findStaticDocsById(id: string) {
  const cleanId = (id || "").trim();

  for (const menu of MENUS) {
    for (const item of menu.items) {
      if (item.group !== "theory") continue;
      if (!item.artifact) continue;

      // id нь яг href-тэй таарах ёстой
      if (item.href === cleanId) {
        return [
          {
            id: cleanId,
            userId: "static",
            title: item.artifact.title ?? item.label,
            kind: "text",
            content: item.artifact.content ?? "",
            createdAt: new Date().toISOString(),
          },
        ];
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api", "Parameter id is missing").toResponse();
  }

  const docs = findStaticDocsById(id);

  // ✅ Олдвол 200
  if (docs) return NextResponse.json(docs, { status: 200 });

  // ✅ Олдохгүй бол 404 (UI өөрөө “хоосон” гэж харуулж болно)
  return new ChatSDKError("not_found:document", "Static document not found").toResponse();
}

// Read-only онол тул одоохондоо бичихийг хориглоно
export async function POST() {
  return new ChatSDKError("forbidden:document", "Static documents are read-only").toResponse();
}

export async function DELETE() {
  return new ChatSDKError("forbidden:document", "Static documents are read-only").toResponse();
}
