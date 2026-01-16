import { NextResponse } from "next/server";
import { MENUS } from "@/config/menus";
import { ChatSDKError } from "@/lib/errors";

/**
 * UI чинь `/api/document?id=...` гэж дуудна.
 * Бид "theory" item-үүдийг MENUS-оос шууд олж Document[] хэлбэрээр буцаана.
 *
 * Анхаарах:
 * - UI нь үргэлж array (Document[]) хүлээдэг.
 * - Олдохгүй бол 404.
 */

// UI-д таарах хамгийн бага Document хэлбэр (DB schema-тай 1:1 байх албагүй, гол нь UI ашиглаж байгаа талбарууд)
type UiDocument = {
  id: string;
  userId: string;
  title: string;
  kind: "text";
  content: string;
  createdAt: string;
};

function normalizeId(raw: string) {
  const x = (raw || "").trim();
  // зарим үед "emotion/feel-now" маягийн slug ирдэг.
  // зарим үед "/mind/emotion/feel-now" route ирдэг.
  // Тэгэхээр хоёуланг нь тааруулахын тулд 2 хувилбар бэлдэнэ.
  const noLeadingSlash = x.startsWith("/") ? x.slice(1) : x;
  const withLeadingSlash = x.startsWith("/") ? x : `/${x}`;
  return { raw: x, noLeadingSlash, withLeadingSlash };
}

function findStaticDocsById(id: string): UiDocument[] | null {
  const { raw, noLeadingSlash, withLeadingSlash } = normalizeId(id);

  for (const menu of MENUS) {
    for (const item of menu.items) {
      if (item.group !== "theory") continue;
      if (!item.artifact) continue;

      // item.href чинь зарим тохиргоонд "/mind/..." (route) байдаг,
      // зарим тохиргоонд "emotion/feel-now" (slug) байдаг байсан.
      // Тиймээс 3 хувилбараар тааруулна.
      const href = (item.href || "").trim();

      const hrefNoLeadingSlash = href.startsWith("/") ? href.slice(1) : href;
      const hrefWithLeadingSlash = href.startsWith("/") ? href : `/${href}`;

      const matched =
        href === raw ||
        hrefNoLeadingSlash === noLeadingSlash ||
        hrefWithLeadingSlash === withLeadingSlash;

      if (!matched) continue;

      return [
        {
          id: raw,
          userId: "static",
          title: item.artifact.title ?? item.label,
          kind: "text",
          content: item.artifact.content ?? "",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return new ChatSDKError("bad_request:api", "Parameter id is missing").toResponse();
    }

    // ✅ tamga (build унагаахгүй, зөвхөн request ирэхэд л log)
    console.log("DOC_ROUTE_HIT v1_static_menus id=", id);

    // ✅ Static theory: DB хэрэглэхгүй, MENUS-оос уншина
    const staticDocs = findStaticDocsById(id);
    if (staticDocs) {
      return NextResponse.json(staticDocs, { status: 200 });
    }

    // Олдохгүй бол 404 (UI чинь энэ үед text байхгүй гэж ойлгоно)
    return new ChatSDKError("not_found:document", "Static artifact not found for id").toResponse();
  } catch (err) {
    console.error("Unhandled /api/document error:", err);
    return new ChatSDKError("offline:document").toResponse();
  }
}

// Энэ route дээр POST/DELETE хийх шаардлагагүй (static MENUS унших гэж байгаа учраас)
// Хэрвээ чамд өмнөх DB-based artifact save хэрэгтэй бол тусдаа route эсвэл өөр файлын хувилбараар явна.
