import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { db, ensureUserIdByEmail } from "@/lib/db/queries";
import { organizationFeedback } from "@/lib/db/schema";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";

const schema = z.object({ destination: z.enum(["ORGANIZATION", "OYUNSANAA"]), body: z.string().trim().min(1).max(5000), idempotencyKey: z.string().uuid() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return NextResponse.json({ error: "ORGANIZATION_ACCESS_REQUIRED" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "DESTINATION_AND_BODY_REQUIRED" }, { status: 400 });
  const input = parsed.data;
  const [created] = await db.insert(organizationFeedback).values({ organizationId: access.organization.id, contractId: access.contract.id, destination: input.destination, body: input.body, idempotencyKey: input.idempotencyKey }).onConflictDoNothing().returning({ id: organizationFeedback.id });
  const [existing] = created ? [created] : await db.select({ id: organizationFeedback.id, organizationId: organizationFeedback.organizationId, contractId: organizationFeedback.contractId, destination: organizationFeedback.destination, body: organizationFeedback.body }).from(organizationFeedback).where(eq(organizationFeedback.idempotencyKey, input.idempotencyKey)).limit(1);
  if (!existing || ("organizationId" in existing && (existing.organizationId !== access.organization.id || existing.contractId !== access.contract.id || existing.destination !== input.destination || existing.body !== input.body))) return NextResponse.json({ error: "FEEDBACK_CONFLICT" }, { status: 409 });
  return NextResponse.json({ id: existing.id, submitted: true }, { status: created ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
}
