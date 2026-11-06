import { getSql } from "@/lib/db/pgClient";
export const dynamic = "force-dynamic";
/** Deployment smoke contract. Contains no credentials or user records. */
export async function GET() {
  let storageReady = false;
  try {
    const sql = getSql();
    if (sql) {
      const [row] =
        await sql`SELECT to_regclass('scheduling.completion_certificate') IS NOT NULL
        AND to_regclass('public."AiAnalysisBudget"') IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ProgramRun_one_active_per_user_program')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ProgramRun' AND column_name='revision')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ProgramRun' AND column_name='assignmentRecipientId') AS ready`;
      storageReady = row?.ready === true;
    }
  } catch {
    /* A deployment with missing schema cannot advertise readiness. */
  }
  return Response.json(
    {
      application: "aichat",
      contract: "audit-2026-11-07",
      releaseId: process.env.RELEASE_ID ?? process.env.DEPLOYMENT_COMMIT ?? "unidentified",
      ready: storageReady,
      features: {
        certificates: storageReady,
        runRevision: storageReady,
        assignmentMedia: true,
        privateUploads: true,
      },
    },
    {
      status: storageReady ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
