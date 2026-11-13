import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail, getUserSubscription } from "@/lib/db/queries";
import { resolveSubscription } from "@/lib/subscription/access";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (session?.user?.email && session.user.type !== "guest") {
    const userId = await ensureUserIdByEmail(session.user.email);
    const [subscription, organizationAccess] = await Promise.all([
      getUserSubscription(userId),
      resolveOrganizationEntitlements(userId),
    ]);
    if (
      subscription &&
      !resolveSubscription(subscription).hasAccess &&
      organizationAccess &&
      !organizationAccess.chatGrant
    )
      redirect("/mind/organization");
  }
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage />
    </Suspense>
  );
}

function NewChatPage() {
  const id = generateUUID();

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
