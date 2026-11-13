import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { recordContentUsage } from "@/lib/taxonomy/recommendations";

const schema = z.object({
  externalKey: z.string().trim().min(1).max(220),
  state: z.enum(["VIEWED", "STARTED", "COMPLETED"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_usage" }, { status: 400 });
  await recordContentUsage({
    userId: session.user.id,
    externalKey: parsed.data.externalKey,
    state: parsed.data.state,
  });
  return NextResponse.json({ ok: true });
}
