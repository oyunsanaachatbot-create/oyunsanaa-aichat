import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ NextAuth v5 ашиглаж байгаа бол:
import { auth } from "@/auth";
// Хэрвээ танайд "@/auth" байхгүй бол доорх 2 мөрийг ашиглаад:
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth"; // танайхаар байж магадгүй

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function getUserIdFromSession() {
  // ✅ NextAuth v5
  const session = await auth();

  // Хэрвээ танайд NextAuth v4 бол:
  // const session = await getServerSession(authOptions);

  const userId =
    // та нарын session дээр user.id байдаг бол:
    (session as any)?.user?.id ||
    // заримдаа sub гэж явдаг:
    (session as any)?.user?.sub;

  return userId as string | null;
}

export async function GET(req: Request) {
  const user_id = await getUserIdFromSession();
  if (!user_id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? isoDate(new Date());

  const supabase = adminSupabase();

  const { data, error } = await supabase
    .from("goal_logs")
    .select("goal_id, log_date, done, note")
    .eq("user_id", user_id)
    .eq("log_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ date, logs: data ?? [] });
}

export async function POST(req: Request) {
  const user_id = await getUserIdFromSession();
  if (!user_id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const goal_id = String(body?.goal_id ?? "");
  const log_date = String(body?.date ?? isoDate(new Date()));
  const done = Boolean(body?.done ?? false);
  const note = typeof body?.note === "string" ? body.note : null;

  if (!goal_id) {
    return NextResponse.json({ error: "MISSING_GOAL_ID" }, { status: 400 });
  }

  const supabase = adminSupabase();

  const { error } = await supabase
    .from("goal_logs")
    .upsert(
      { user_id, goal_id, log_date, done, note },
      { onConflict: "user_id,goal_id,log_date" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
