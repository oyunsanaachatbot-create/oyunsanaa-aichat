CREATE TABLE IF NOT EXISTS "PaymentTransactionLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" uuid,
	"senderInvoiceNo" varchar(64),
	"qpayInvoiceId" text,
	"event" varchar(32) NOT NULL,
	"source" varchar(16) NOT NULL,
	"amount" integer,
	"currency" varchar(8),
	"ip" varchar(64),
	"message" text,
	"raw" json
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PaymentTransactionLog_senderInvoiceNo_idx" ON "PaymentTransactionLog" USING btree ("senderInvoiceNo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PaymentTransactionLog_createdAt_idx" ON "PaymentTransactionLog" USING btree ("createdAt");