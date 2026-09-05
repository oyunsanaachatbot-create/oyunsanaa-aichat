export type OrganizationRole = "EMPLOYEE" | "MANAGER" | "DIRECTOR";

export function roleCanAccessProgram(
  role: OrganizationRole,
  allowedRoles: readonly string[]
) {
  return allowedRoles.includes(role);
}

export function isActiveWindow(
  status: string,
  startsAt: Date,
  endsAt: Date,
  now = new Date()
) {
  return (
    status === "ACTIVE" &&
    startsAt.getTime() <= now.getTime() &&
    endsAt.getTime() > now.getTime()
  );
}

export function organizationAiGrantEndsAt(startsAt: Date) {
  return new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
}
