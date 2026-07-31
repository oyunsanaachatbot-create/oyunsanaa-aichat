CREATE TABLE IF NOT EXISTS "psychologist_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"psychologist_id" uuid NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "psychologist_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" varchar NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychologist_conversation" ADD CONSTRAINT "psychologist_conversation_patient_id_User_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychologist_conversation" ADD CONSTRAINT "psychologist_conversation_psychologist_id_User_id_fk" FOREIGN KEY ("psychologist_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychologist_message" ADD CONSTRAINT "psychologist_message_conversation_id_psychologist_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."psychologist_conversation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "psychologist_message" ADD CONSTRAINT "psychologist_message_sender_id_User_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "psychologist_conversation_patient_unique" ON "psychologist_conversation" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psychologist_conversation_psychologist_idx" ON "psychologist_conversation" USING btree ("psychologist_id","last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psychologist_message_conversation_idx" ON "psychologist_message" USING btree ("conversation_id","created_at");