let owner: string | null = null;
export function setPrivateCacheOwner(userId: string | null) {
  owner = userId;
}
export function privateCacheKey(base: string) {
  if (!owner) throw new Error("private_cache_session_not_ready");
  return `oyunsanaa:user:${owner}:${base}`;
}
