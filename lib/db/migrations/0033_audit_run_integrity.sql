-- Generated from schema, then narrowed: 0026-0032 already own the organization tables.
ALTER TABLE public."ProgramRun" ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE public."ProgramRun" ADD COLUMN IF NOT EXISTS "assignmentRecipientId" uuid;
--> statement-breakpoint
-- Refuse ambiguous history instead of silently reassigning a result to the wrong recipient.
DO $$ BEGIN
 IF EXISTS (SELECT "programRunId" FROM public."OrganizationAssessmentAssignment" WHERE "programRunId" IS NOT NULL GROUP BY "programRunId" HAVING count(*) > 1)
 THEN RAISE EXCEPTION 'Multiple assignments share a ProgramRun; review before migration'; END IF;
END $$;
--> statement-breakpoint
UPDATE public."ProgramRun" r SET "assignmentRecipientId" = a."recipientId"
FROM public."OrganizationAssessmentAssignment" a WHERE a."programRunId" = r.id AND r."assignmentRecipientId" IS NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS public."ProgramRun_one_active_per_user_program";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramRun_assignment_recipient_key" ON public."ProgramRun" ("assignmentRecipientId");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramRun_personal_active_key" ON public."ProgramRun" ("userId", "programId", "programVersionId") WHERE status='IN_PROGRESS' AND "organizationContractId" IS NULL AND "assignmentRecipientId" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramRun_legacy_active_key" ON public."ProgramRun" ("userId", "programId", "programVersionId", "organizationContractId") WHERE status='IN_PROGRESS' AND "organizationContractId" IS NOT NULL AND "assignmentRecipientId" IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."AiAnalysisBudget" (
 "userId" uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
 day varchar(10) NOT NULL, requests integer NOT NULL DEFAULT 0,
 CONSTRAINT "AiAnalysisBudget_userId_day_pk" PRIMARY KEY ("userId", day)
);
