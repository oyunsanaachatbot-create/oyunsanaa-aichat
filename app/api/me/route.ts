import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";

const AVATAR_PATH =
  /^\/(?:api\/)?uploads\/avatars\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)$/i;

export async function GET() {
  const session = await auth();
  const user = session?.user;
  let avatarPath: string | null = null;
  const sql = getSql();

  if (sql && user?.id && user.type !== "guest") {
    const [schema] =
      await sql`SELECT to_regclass('scheduling.psychologist_profile') IS NOT NULL AS ready`;
    if (schema?.ready) {
      const [profile] = await sql<{ avatar_url: string | null }[]>`
        SELECT avatar_url FROM scheduling.psychologist_profile WHERE user_id = ${user.id}::uuid
      `;
      const stored = profile?.avatar_url;
      if (stored && AVATAR_PATH.test(stored)) {
        avatarPath = stored.startsWith("/api/") ? stored : `/api${stored}`;
      }
    }
  }

  return Response.json(
    {
      hasSession: !!session,
      user: user
        ? { id: user.id, email: user.email, type: user.type, avatarPath }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
