import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getPgAdmin } from "@/lib/db/pgClient";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const db = getPgAdmin();
    const { data, error } = await db
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json({ error: "no_rows" }, { status: 400 });
    }

    const db = getPgAdmin();
    const safeRows = rows.map((r: any) => ({ ...r, user_id: userId }));

    // Insert one at a time to get back data for single inserts, batch otherwise
    if (safeRows.length === 1) {
      const { data, error } = await db
        .from("transactions")
        .insert(safeRows[0])
        .select("*")
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true, row: data });
    }

    const { error } = await db.from("transactions").insert(safeRows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const db = getPgAdmin();

    if (id) {
      const { error } = await db
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // delete all for user
      const { error } = await db
        .from("transactions")
        .delete()
        .eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown_error" }, { status: 500 });
  }
}
