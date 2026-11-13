-- Adopt existing goal planner tables without changing or deleting their rows.
CREATE TABLE IF NOT EXISTS "goal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_text" text NOT NULL,
	"category" text,
	"priority" integer DEFAULT 3 NOT NULL,
	"target_date" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"goal_type" text,
	"start_date" date,
	"end_date" date,
	"description" text,
	"effort_unit" text DEFAULT 'Өдөрт',
	"effort_hours" integer DEFAULT 0,
	"effort_minutes" integer DEFAULT 0,
	"frequency" integer[],
	"local_id" text,
	"completed_days" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goal_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goal_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'Зорилгын багц' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goal_items" ADD CONSTRAINT "goal_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."goal_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goal_logs" ADD CONSTRAINT "goal_logs_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goal_logs" ADD CONSTRAINT "goal_logs_goal_id_goal_items_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goal_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "goal_logs_user_date_idx" ON "goal_logs" USING btree ("user_id","log_date","created_at");
--> statement-breakpoint
-- drizzle-kit 0.25 does not emit pg-core check constraints; keep the schema check here.
DO $$ BEGIN
 ALTER TABLE "goal_logs" ADD CONSTRAINT "goal_logs_minutes_range" CHECK ("minutes" >= 0 AND "minutes" <= 1440);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
