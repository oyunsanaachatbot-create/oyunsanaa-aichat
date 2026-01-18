import { auth } from "@/app/(auth)/auth";

export async function GET() {
  const session = await auth();

  return Response.json({
    hasSession: !!session,
    user: session?.user
      ? { id: session.user.id, email: session.user.email, type: session.user.type }
      : null,
  });
}
