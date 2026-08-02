import "server-only";

import { auth } from "@/app/(auth)/auth";
import { getUserRoleById } from "@/lib/db/queries";

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = await getUserRoleById(session.user.id);
  return role === "ADMIN" ? session : null;
}
