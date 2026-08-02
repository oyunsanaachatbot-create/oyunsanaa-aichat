import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { recordAppEvent } from "@/lib/observability/app-events";

const payloadSchema = z.object({
  message: z.string().trim().min(1).max(500),
  path: z.string().trim().max(300),
  source: z.string().trim().max(300).optional(),
  line: z.number().int().nonnegative().optional(),
  column: z.number().int().nonnegative().optional(),
  kind: z.enum(["window_error", "unhandled_rejection"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = payloadSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  await recordAppEvent({
    level: "error",
    event: "client_runtime_error",
    source: "browser",
    route: parsed.data.path,
    requestId: randomUUID(),
    userId: session.user.id,
    errorCode: parsed.data.kind,
    message: parsed.data.message,
    metadata: {
      source: parsed.data.source,
      line: parsed.data.line,
      column: parsed.data.column,
      userAgent: request.headers.get("user-agent")?.slice(0, 200),
    },
  });
  return NextResponse.json({ ok: true });
}
