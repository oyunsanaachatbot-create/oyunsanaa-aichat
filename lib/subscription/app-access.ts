/** Shell access is distinct from paid personal features and individual purchases. */
export function resolveAppAccess(input: {
  personalHasAccess: boolean;
  admin: boolean;
  organizationActive: boolean;
}) {
  const source = input.admin
    ? "admin"
    : input.personalHasAccess
      ? "personal"
      : input.organizationActive
        ? "organization"
        : "none";
  return { canAccessApp: source !== "none", accessSource: source } as const;
}
