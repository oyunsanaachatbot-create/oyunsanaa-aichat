CREATE TABLE IF NOT EXISTS "Program" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"status" varchar DEFAULT 'DRAFT' NOT NULL,
	"renderer" varchar DEFAULT 'BUILDER' NOT NULL,
	"legacyKey" varchar(80),
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdById" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProgramRun" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"programId" uuid NOT NULL,
	"programVersionId" uuid NOT NULL,
	"status" varchar DEFAULT 'IN_PROGRESS' NOT NULL,
	"currentSectionId" varchar(64) NOT NULL,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProgramVersion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programId" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" varchar DEFAULT 'DRAFT' NOT NULL,
	"definition" jsonb NOT NULL,
	"createdById" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"publishedAt" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Program" ADD CONSTRAINT "Program_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramRun" ADD CONSTRAINT "ProgramRun_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramRun" ADD CONSTRAINT "ProgramRun_programId_Program_id_fk" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramRun" ADD CONSTRAINT "ProgramRun_programVersionId_ProgramVersion_id_fk" FOREIGN KEY ("programVersionId") REFERENCES "public"."ProgramVersion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramVersion" ADD CONSTRAINT "ProgramVersion_programId_Program_id_fk" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramVersion" ADD CONSTRAINT "ProgramVersion_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Program_slug_unique" ON "Program" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Program_status_sort_idx" ON "Program" USING btree ("status","sortOrder");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProgramRun_user_status_updated_idx" ON "ProgramRun" USING btree ("userId","status","updatedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProgramRun_user_program_updated_idx" ON "ProgramRun" USING btree ("userId","programId","updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramVersion_program_version_unique" ON "ProgramVersion" USING btree ("programId","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProgramVersion_program_status_version_idx" ON "ProgramVersion" USING btree ("programId","status","version");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramVersion_one_draft_per_program" ON "ProgramVersion" ("programId") WHERE "status" = 'DRAFT';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramVersion_one_published_per_program" ON "ProgramVersion" ("programId") WHERE "status" = 'PUBLISHED';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramRun_one_active_per_user_program" ON "ProgramRun" ("userId", "programId") WHERE "status" = 'IN_PROGRESS';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Program" ADD CONSTRAINT "Program_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Program" ADD CONSTRAINT "Program_renderer_check" CHECK ("renderer" IN ('BUILDER', 'LEGACY'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramVersion" ADD CONSTRAINT "ProgramVersion_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'RETIRED'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ProgramRun" ADD CONSTRAINT "ProgramRun_status_check" CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
INSERT INTO "Program" ("slug", "status", "renderer", "legacyKey", "sortOrder")
VALUES ('life-balance', 'PUBLISHED', 'LEGACY', 'life-balance-v1', 0)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
INSERT INTO "ProgramVersion" ("programId", "version", "status", "definition", "publishedAt")
SELECT
  "id",
  1,
  'PUBLISHED',
  '{"schemaVersion":1,"locale":"mn","title":"Амьдралын тэнцвэрээ ойлгох","summary":"Өөрийгөө ойлгох үндсэн хөтөлбөр","icon":"🧭","estimatedMinutes":30,"sections":[{"id":"intro","type":"CONTENT","title":"Амьдралын тэнцвэрээ ойлгох","body":"Өөрийн амьдралын дөрвөн талбар, бодит чадвар, нөөц боломжоо ажиглан судална.","skippable":false,"questions":[],"tasks":[],"repeatDays":1,"resultBands":[]}]}'::jsonb,
  now()
FROM "Program"
WHERE "slug" = 'life-balance'
ON CONFLICT ("programId", "version") DO NOTHING;
