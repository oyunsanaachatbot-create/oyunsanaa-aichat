export type AppRole =
  | "PATIENT"
  | "PSYCHOLOGIST"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "ADMIN_USER";

function normalizedRole(role: string | null | undefined): string {
  return role?.trim().toUpperCase() ?? "";
}

export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizedRole(role);
  return (
    normalized === "ADMIN" ||
    normalized === "SUPER_ADMIN" ||
    normalized === "ADMIN_USER"
  );
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return normalizedRole(role) === "SUPER_ADMIN";
}

export function canSeeAppointmentCta(role: string | null | undefined): boolean {
  const normalized = normalizedRole(role);
  return normalized !== "ADMIN" && normalized !== "ADMIN_USER";
}

export function canSeeOnlinePsychologistMenu(
  role: string | null | undefined
): boolean {
  return normalizedRole(role) !== "ADMIN_USER";
}
