ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "price" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "Program" ADD CONSTRAINT "Program_price_check" CHECK ("price" >= 0);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProgramPurchase" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "programId" uuid NOT NULL,
  "buyerId" uuid NOT NULL,
  "amount" integer NOT NULL,
  "status" varchar DEFAULT 'PENDING' NOT NULL,
  "senderInvoiceNo" varchar(100) NOT NULL,
  "qpayInvoiceId" varchar(200),
  "qpayPaymentId" varchar(200),
  "qrPayload" text,
  "paidAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ProgramPurchase_amount_check" CHECK ("amount" >= 0),
  CONSTRAINT "ProgramPurchase_status_check" CHECK ("status" IN ('PENDING', 'PAID', 'CANCELLED'))
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ProgramPurchase" ADD CONSTRAINT "ProgramPurchase_programId_Program_id_fk" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ProgramPurchase" ADD CONSTRAINT "ProgramPurchase_buyerId_User_id_fk" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramPurchase_sender_invoice_unique" ON "ProgramPurchase" USING btree ("senderInvoiceNo");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramPurchase_program_buyer_unique" ON "ProgramPurchase" USING btree ("programId", "buyerId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProgramPurchase_buyer_status_idx" ON "ProgramPurchase" USING btree ("buyerId", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProgramPurchase_program_status_idx" ON "ProgramPurchase" USING btree ("programId", "status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ProgramVideoAsset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "programId" uuid,
  "videoId" varchar(100) NOT NULL,
  "title" varchar(300) NOT NULL,
  "status" varchar DEFAULT 'PROCESSING' NOT NULL,
  "durationSeconds" integer,
  "thumbnailUrl" varchar(1000),
  "createdById" uuid,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ProgramVideoAsset_status_check" CHECK ("status" IN ('PROCESSING', 'READY', 'FAILED'))
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ProgramVideoAsset" ADD CONSTRAINT "ProgramVideoAsset_programId_Program_id_fk" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ProgramVideoAsset" ADD CONSTRAINT "ProgramVideoAsset_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramVideoAsset_video_unique" ON "ProgramVideoAsset" USING btree ("videoId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProgramVideoAsset_program_status_idx" ON "ProgramVideoAsset" USING btree ("programId", "status");
