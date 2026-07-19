CREATE TABLE IF NOT EXISTS "WhoAmIProgramRun" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"screen" varchar(32) DEFAULT 'area' NOT NULL,
	"pct" json NOT NULL,
	"notes" json NOT NULL,
	"answers" json NOT NULL,
	"scores" json NOT NULL,
	"finalNote" text DEFAULT '' NOT NULL,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "WhoAmIProgramRun" ADD CONSTRAINT "WhoAmIProgramRun_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "WhoAmIProgramRun_user_completed_updated_idx" ON "WhoAmIProgramRun" USING btree ("userId","completedAt","updatedAt");