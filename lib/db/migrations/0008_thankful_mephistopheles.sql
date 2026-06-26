CREATE TABLE IF NOT EXISTS "therapy_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" text,
	"client_email" varchar(64) NOT NULL,
	"psychologist_email" varchar(64) NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "therapy_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_email" varchar(64) NOT NULL,
	"sender_role" varchar NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapy_message" ADD CONSTRAINT "therapy_message_conversation_id_therapy_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."therapy_conversation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "therapy_conversation_appointment_unique" ON "therapy_conversation" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "therapy_message_conversation_idx" ON "therapy_message" USING btree ("conversation_id","created_at");
