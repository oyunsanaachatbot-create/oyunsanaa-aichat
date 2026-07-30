import { NextResponse } from "next/server";
import {
  assertDirectConversationAccess,
  updateDirectConversationStatus,
} from "@/lib/db/psychologist-chat";
import { getPsychologistChatActor } from "../../actor";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteCtx) {
  const actor = await getPsychologistChatActor();
  if (!actor) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertDirectConversationAccess(id, actor);
  if (!access) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (access.role !== "psychologist") {
    return NextResponse.json(
      { error: "Only the psychologist can change the chat status" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updateDirectConversationStatus(id, status);
  return NextResponse.json({ status });
}
