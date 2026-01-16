import { NextResponse } from "next/server";
import { MENUS } from "@/config/menus";

// ⚠️ Танайд Supabase client хаанаас импортлодог нь өөр байж магадгүй.
// Доорх import мөрийг ТАНЫ одоогийн route.ts дээр байгаагаар нь үлдээгээрэй.
import { createClient } from "@/lib/supabase/server"; // <-- хэрвээ өөр байвал солино

// -----------------------------
// 1) Static theory lookup (MENUS)
// -----------------------------
function getStaticTheoryById(id: string) {
  const cleanId = (id || "").trim();

  for (const menu of MENUS) {
    for (const item of menu.items) {
      if (item.group !== "theory") continue;
      if (!item.artifact) continue;

      // menus.ts дээр theory item.href = "emotion/feel-now" (slug)
      if (item.href === cleanId) {
        const title = item.artifact.title ?? item.label;
        const content =
          item.artifact.content ??
          (item.artifact as any).markdown ??
          (item.artifact as any).body ??
          "";

        // UI чинь Document[] array хүлээдэг тул [ ... ] хэлбэрээр буцаана
        return [
          {
            id: cleanId,
            title,
            kind: "text",
            content,
            userId: "static",
            createdAt: new Date().toISOString(),
          },
        ];
      }
    }
  }

  return null;
}

// -----------------------------
// GET /api/document?id=...
// -----------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // ✅ 1) Static theory бол DB рүү ОРОХГҮЙ
    const staticDocs = getStaticTheoryById(id);
    if (staticDocs) {
      return NextResponse.json(staticDocs, { status: 200 });
    }

    // ✅ 2) Static биш бол DB fallback (хуучин behavior)
    const supabase = createClient();

    // Танай schema дээр documents хүснэгт дээрх баганууд: user_id, created_at гэх мэт байна.
    const { data, error } = await supabase
      .from("documents")
      .select("id, user_id, title, kind, content, created_at")
      .eq("id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET /api/document db error:", error);
      return NextResponse.json({ error: "DB query failed" }, { status: 500 });
    }

    // UI чинь array хүлээдэг
    const docs =
      (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        kind: d.kind,
        content: d.content,
        createdAt: d.created_at,
      })) ?? [];

    return NextResponse.json(docs, { status: 200 });
  } catch (e) {
    console.error("GET /api/document error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// -----------------------------
// POST /api/document?id=...  (save version)
// -----------------------------
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { title, content, kind } = body as {
      title: string;
      content: string;
      kind: string;
    };

    const supabase = createClient();

    // ⚠️ user_id шаарддаг бол энд session/auth-оос авна.
    // Одоохондоо таны өмнөх код шиг DB ашиглаж байсан тул placeholder.
    // Хэрвээ auth шаардлагатай бол хэл — би яг танай auth() ашиглаад зөв болгож өгнө.
    const userId = "unknown";

    const { data, error } = await supabase
      .from("documents")
      .insert({
        id,
        user_id: userId,
        title,
        kind,
        content,
      })
      .select("id, user_id, title, kind, content, created_at")
      .single();

    if (error) {
      console.error("POST /api/document db error:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        kind: data.kind,
        content: data.content,
        createdAt: data.created_at,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("POST /api/document error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// -----------------------------
// DELETE /api/document?id=...&timestamp=...
// -----------------------------
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();
    const timestamp = (searchParams.get("timestamp") || "").trim();

    if (!id || !timestamp) {
      return NextResponse.json(
        { error: "Missing id or timestamp" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .gt("created_at", timestamp)
      .select("id, user_id, title, kind, content, created_at");

    if (error) {
      console.error("DELETE /api/document db error:", error);
      return NextResponse.json({ error: "DB delete failed" }, { status: 500 });
    }

    const deleted =
      (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        title: d.title,
        kind: d.kind,
        content: d.content,
        createdAt: d.created_at,
      })) ?? [];

    return NextResponse.json(deleted, { status: 200 });
  } catch (e) {
    console.error("DELETE /api/document error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
