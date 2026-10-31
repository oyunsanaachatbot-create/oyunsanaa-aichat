export function safeCallback(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://app.invalid");
    if (url.origin !== "https://app.invalid" || /^\/(login|register)(\/|$)/.test(decodeURIComponent(url.pathname))) return "/";
    return url.pathname + url.search + url.hash;
  } catch { return "/"; }
}
