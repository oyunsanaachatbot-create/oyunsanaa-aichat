import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";
import { conversationChannel } from "@/lib/db/therapy-channel";
import { assertConversationAccess } from "@/lib/db/therapy";

// LISTEN needs a real Node connection (not edge) and must not be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// GET — Server-Sent Events stream of new messages for a conversation, backed
// by Postgres LISTEN/NOTIFY. Each `data:` frame is one message JSON.
export async function GET(_req: Request, { params }: RouteCtx) {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const access = await assertConversationAccess(id, { id: userId, email });
  if (!access) {
    return new Response("Forbidden", { status: 403 });
  }

  const sql = getSql();
  if (!sql) {
    return new Response("DB unavailable", { status: 500 });
  }

  const channel = conversationChannel(id);
  const encoder = new TextEncoder();
  let listener: { unlisten: () => Promise<void> } | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      listener = await sql.listen(channel, (payload) => {
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      });
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // controller already closed
        }
      }, 25_000);
    },
    async cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      if (listener) {
        await listener.unlisten();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
