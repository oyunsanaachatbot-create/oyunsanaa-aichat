CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"qpayInvoiceId" text,
	"senderInvoiceNo" varchar(64) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'MNT' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"paidAt" timestamp with time zone,
	CONSTRAINT "SubscriptionPayment_senderInvoiceNo_unique" UNIQUE("senderInvoiceNo")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "trialStartedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" varchar DEFAULT 'trialing' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "currentPeriodEnd" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
