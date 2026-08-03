CREATE TABLE IF NOT EXISTS "EbookNote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"clientId" varchar(80) NOT NULL,
	"sectionId" varchar(40) NOT NULL,
	"title" varchar(240) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"includeInBook" boolean DEFAULT true NOT NULL,
	"templateId" varchar(48) DEFAULT 'paper-white' NOT NULL,
	"imageUrl" text DEFAULT '' NOT NULL,
	"imageCaption" text DEFAULT '' NOT NULL,
	"imageAspect" varchar(24) DEFAULT '' NOT NULL,
	"noteCreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "EbookNote" ADD CONSTRAINT "EbookNote_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "EbookNote_userId_sectionId_clientId_unique" ON "EbookNote" USING btree ("userId","sectionId","clientId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "EbookNote_userId_sectionId_noteCreatedAt_idx" ON "EbookNote" USING btree ("userId","sectionId","noteCreatedAt");