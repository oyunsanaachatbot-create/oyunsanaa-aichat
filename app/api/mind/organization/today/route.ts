import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail } from "@/lib/db/queries";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { loadOrganizationToday } from "@/lib/organizations/instance-runtime";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return NextResponse.json({ error: "ORGANIZATION_ACCESS_REQUIRED" }, { status: 403 });
  const cards = await loadOrganizationToday(access);
  return NextResponse.json({ cards }, { headers: { "Cache-Control": "private, no-store" } });
}
