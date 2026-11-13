import { getPsychologistChatActor } from "../../actor";
import { assertDirectConversationAccess } from "@/lib/db/psychologist-chat";
import { psychologistConversationChannel } from "@/lib/db/therapy-channel";
import { getSql } from "@/lib/db/pgClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  const actor = await getPsychologistChatActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!(await assertDirectConversationAccess(id, actor))) {
    return new Response("Forbidden", { status: 403 });
  }

  const sql = getSql();
  if (!sql) return new Response("DB unavailable", { status: 500 });

  const channel = psychologistConversationChannel(id);
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
          // The browser already closed the stream.
        }
      }, 25_000);
    },
    async cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (listener) await listener.unlisten();
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
