export async function setActiveArtifact(params: { slug: string; title: string }) {
  try {
    await fetch("/api/user/active-artifact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // UI эвдэхгүй, дуугүй өнгөрнө
  }
}
