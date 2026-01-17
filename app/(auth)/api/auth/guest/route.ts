import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  // ❗️ signIn өөрөө redirect хийдэг
  return signIn("guest", {
    redirect: true,
    redirectTo: redirectUrl,
  });
}
