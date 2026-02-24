export function isGuestUserId(userId?: string) {
  const id = (userId || "").trim().toLowerCase();
  if (!id) return true;

  // хамгийн түгээмэл guest/test id-ууд
  if (id === "guest" || id === "anonymous" || id === "demo" || id === "0000") return true;

  // temp-... маягийн
  if (id.startsWith("temp-") || id.startsWith("guest-")) return true;

  return false;
}
