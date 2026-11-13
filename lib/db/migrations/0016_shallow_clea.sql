CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(64) NOT NULL,
  "tokenHash" varchar(64) NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "EmailVerificationToken"
  ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DELETE FROM "EmailVerificationToken" older
USING "EmailVerificationToken" newer
WHERE lower(older."email") = lower(newer."email")
  AND (
    older."createdAt" < newer."createdAt"
    OR (
      older."createdAt" = newer."createdAt"
      AND older."id" < newer."id"
    )
  );
--> statement-breakpoint
UPDATE "EmailVerificationToken"
SET "email" = lower(trim("email"));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_email_unique"
  ON "EmailVerificationToken" USING btree ("email");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.app_migration_marker (
  key text PRIMARY KEY,
  applied_at timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_migration_marker
    WHERE key = 'email_otp_existing_users_verified_20260726'
  ) THEN
    UPDATE "User"
    SET "emailVerifiedAt" = now()
    WHERE "emailVerifiedAt" IS NULL;
    INSERT INTO public.app_migration_marker (key)
    VALUES ('email_otp_existing_users_verified_20260726');
  END IF;
END $$;
