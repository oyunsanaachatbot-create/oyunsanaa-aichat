import "server-only";
import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db/pgClient";

export type CompletionCertificate = {
  id: string;
  run_id: string;
  user_id: string;
  participant_name: string;
  program_title: string;
  completed_at: Date;
  issued_at: Date;
  public_name: boolean;
  revoked_at: Date | null;
  revocation_reason: string | null;
};
export class CertificateError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function certificateStorage() {
  const db = getSql();
  if (!db)
    throw new CertificateError(
      "Сертификатын хадгалалт тохируулагдаагүй байна.",
      503
    );
  const [storage] =
    await db`SELECT to_regclass('scheduling.completion_certificate') IS NOT NULL AS ready`;
  if (!storage?.ready)
    throw new CertificateError(
      "Сертификатын хадгалалт хараахан идэвхжээгүй байна.",
      503
    );
  return db;
}
export async function issueCompletionCertificate(
  userId: string,
  runId: string
) {
  const db = await certificateStorage();
  return db.begin(async (tx) => {
    // Lock the source completion. The browser supplies only its identifier.
    const [run] = await tx`
      SELECT r.id, r."programId", r."programVersionId", r."completedAt", u.name, v.definition
      FROM public."ProgramRun" r JOIN public."User" u ON u.id=r."userId"
      JOIN public."ProgramVersion" v ON v.id=r."programVersionId" AND v."programId"=r."programId" AND v.status='PUBLISHED'
      WHERE r.id=${runId}::uuid AND r."userId"=${userId}::uuid
        AND r.status='COMPLETED' AND r."completedAt" IS NOT NULL AND r."completedAt"<=now()
      FOR UPDATE OF r`;
    if (!run)
      throw new CertificateError(
        "Дуусгасан өөрийн сургалт, хөтөлбөрөө сонгоно уу.",
        404
      );
    const definition = run.definition as {
      contentType?: string;
      title?: string;
      certificate?: { enabled?: boolean; title?: string };
    };
    if (
      !definition.certificate?.enabled ||
      !["TRAINING", "PROGRAM"].includes(definition.contentType ?? "")
    )
      throw new CertificateError(
        "Энэ контентын батлагдсан хувилбар сертификат олгохгүй.",
        409
      );
    const participant = typeof run.name === "string" ? run.name.trim() : "";
    if (!participant)
      throw new CertificateError(
        "Сертификат авахын өмнө профайлдаа нэрээ оруулна уу.",
        409
      );
    const title = definition.certificate.title || definition.title;
    if (!title)
      throw new CertificateError(
        "Сертификатын нэр тохируулагдаагүй байна.",
        409
      );
    await tx`INSERT INTO scheduling.completion_certificate(id,run_id,user_id,program_id,program_version_id,participant_name,program_title,completed_at)
      VALUES(${randomUUID()}::uuid,${runId}::uuid,${userId}::uuid,${run.programId}::uuid,${run.programVersionId}::uuid,${participant},${title},${run.completedAt})
      ON CONFLICT(run_id) DO NOTHING`;
    const [certificate] = await tx<
      CompletionCertificate[]
    >`SELECT * FROM scheduling.completion_certificate WHERE run_id=${runId}::uuid AND user_id=${userId}::uuid`;
    return certificate;
  });
}
export async function listCompletionCertificates(userId: string) {
  const db = await certificateStorage();
  return db<
    CompletionCertificate[]
  >`SELECT * FROM scheduling.completion_certificate WHERE user_id=${userId}::uuid ORDER BY issued_at DESC,id DESC LIMIT 200`;
}
export async function ownedCompletionCertificate(userId: string, id: string) {
  const db = await certificateStorage();
  const [certificate] = await db<
    CompletionCertificate[]
  >`SELECT * FROM scheduling.completion_certificate WHERE id=${id}::uuid AND user_id=${userId}::uuid`;
  return certificate ?? null;
}
export async function verifyCompletionCertificate(id: string) {
  const db = await certificateStorage();
  // No user ID, answers, contact information or revocation reason is public.
  const [certificate] = await db<
    (Pick<
      CompletionCertificate,
      "id" | "program_title" | "completed_at" | "issued_at" | "revoked_at"
    > & { participant_name: string | null })[]
  >`SELECT id,program_title,completed_at,issued_at,revoked_at,
    CASE WHEN public_name THEN participant_name ELSE NULL END AS participant_name
    FROM scheduling.completion_certificate WHERE id=${id}::uuid`;
  return certificate ?? null;
}
