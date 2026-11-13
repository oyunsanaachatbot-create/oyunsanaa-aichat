import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  CertificateError,
  issueCompletionCertificate,
  listCompletionCertificates,
} from "@/lib/certificates/server";
const schema = z.object({ runId: z.string().uuid() }).strict();
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest")
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  try {
    return Response.json(
      { certificates: await listCompletionCertificates(session.user.id) },
      { headers }
    );
  } catch (error) {
    if (error instanceof CertificateError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers }
      );
    throw error;
  }
}
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest")
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return Response.json(
      { error: "Сургалтын дугаараа шалгана уу." },
      { status: 400, headers }
    );
  try {
    return Response.json(
      {
        certificate: await issueCompletionCertificate(
          session.user.id,
          input.data.runId
        ),
      },
      { headers }
    );
  } catch (error) {
    if (error instanceof CertificateError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers }
      );
    throw error;
  }
}
