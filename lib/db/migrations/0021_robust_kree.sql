CREATE TABLE IF NOT EXISTS "AppEventLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"level" varchar NOT NULL,
	"event" varchar(96) NOT NULL,
	"source" varchar(64) NOT NULL,
	"route" varchar(160),
	"requestId" varchar(64),
	"userId" uuid,
	"chatId" uuid,
	"model" varchar(64),
	"statusCode" integer,
	"errorCode" varchar(96),
	"message" text,
	"inputTokens" integer,
	"cachedInputTokens" integer,
	"cacheWriteTokens" integer,
	"outputTokens" integer,
	"reasoningTokens" integer,
	"totalTokens" integer,
	"historyCount" integer,
	"imageCount" integer,
	"durationMs" integer,
	"metadata" jsonb
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AppEventLog" ADD CONSTRAINT "AppEventLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AppEventLog_createdAt_idx" ON "AppEventLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AppEventLog_level_createdAt_idx" ON "AppEventLog" USING btree ("level","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AppEventLog_userId_createdAt_idx" ON "AppEventLog" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AppEventLog_event_createdAt_idx" ON "AppEventLog" USING btree ("event","createdAt");