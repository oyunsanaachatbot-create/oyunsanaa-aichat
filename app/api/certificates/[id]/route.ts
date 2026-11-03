import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  certificateStorage,
  CertificateError,
  verifyCompletionCertificate,
} from "@/lib/certificates/server";
const schema = z.object({ publicName: z.boolean() }).strict();
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return Response.json({ error: "not_found" }, { status: 404, headers });
  try {
    const certificate = await verifyCompletionCertificate(id);
    return certificate
      ? Response.json({ certificate }, { headers })
      : Response.json({ error: "not_found" }, { status: 404, headers });
  } catch (error) {
    if (error instanceof CertificateError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers }
      );
    throw error;
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest")
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  const { id } = await params,
    input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success || !z.string().uuid().safeParse(id).success)
    return Response.json({ error: "invalid_input" }, { status: 400, headers });
  try {
    const db = await certificateStorage();
    const [certificate] =
      await db`UPDATE scheduling.completion_certificate SET public_name=${input.data.publicName} WHERE id=${id}::uuid AND user_id=${session.user.id}::uuid RETURNING id,public_name`;
    return certificate
      ? Response.json({ certificate }, { headers })
      : Response.json({ error: "not_found" }, { status: 404, headers });
  } catch (error) {
    if (error instanceof CertificateError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers }
      );
    throw error;
  }
}
