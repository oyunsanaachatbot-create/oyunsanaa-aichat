import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteAllChatsByUserId,
  ensureUserIdByEmail,
  getChatsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

const PAGE_SIZE_DEFAULT = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(
    searchParams.get("limit") || String(PAGE_SIZE_DEFAULT),
    10
  );
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const dbUserId = await ensureUserIdByEmail(email);

  const chats = await getChatsByUserId({
    id: dbUserId,
    limit,
    startingAfter,
    endingBefore,
  });

  const hasMore = chats.length === limit;

  return Response.json({ chats, hasMore });
}

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const dbUserId = await ensureUserIdByEmail(email);

  const result = await deleteAllChatsByUserId({ userId: dbUserId });

  return Response.json(result, { status: 200 });
}
