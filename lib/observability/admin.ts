import "server-only";

import { auth } from "@/app/(auth)/auth";
import { isSuperAdminRole } from "@/lib/auth/roles";
import { getUserRoleById } from "@/lib/db/queries";

export async function getSuperAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = await getUserRoleById(session.user.id);
  return isSuperAdminRole(role) ? session : null;
}
