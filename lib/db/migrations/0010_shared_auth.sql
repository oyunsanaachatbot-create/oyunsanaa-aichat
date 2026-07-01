ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" varchar(20) DEFAULT 'PATIENT' NOT NULL;--> statement-breakpoint
-- Migrate scheduling users into public.User (web-registered users get a chat account)
INSERT INTO "User" (id, email, password, name, role, "trialStartedAt", "subscriptionStatus")
SELECT su.id::uuid, LOWER(su.email), su.password_hash, su.name, su.role::text, NOW(), 'trialing'
FROM scheduling.user su
WHERE NOT EXISTS (SELECT 1 FROM "User" pu WHERE LOWER(pu.email) = LOWER(su.email))
  AND NOT EXISTS (SELECT 1 FROM "User" pu WHERE pu.id = su.id::uuid)
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Sync name/role for users already in both tables
UPDATE "User" pu
SET name = su.name, role = su.role::text
FROM scheduling.user su
WHERE LOWER(pu.email) = LOWER(su.email) AND pu.name IS NULL;--> statement-breakpoint
-- Drop old FK constraints (they point to scheduling.user which is being deprecated for auth)
DO $$ BEGIN ALTER TABLE scheduling.psychologist_profile DROP CONSTRAINT psychologist_profile_user_id_fkey; EXCEPTION WHEN undefined_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE scheduling.availability DROP CONSTRAINT availability_psychologist_id_fkey; EXCEPTION WHEN undefined_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE scheduling.appointment DROP CONSTRAINT appointment_patient_id_fkey; EXCEPTION WHEN undefined_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE scheduling.appointment DROP CONSTRAINT appointment_psychologist_id_fkey; EXCEPTION WHEN undefined_object THEN null; END $$;--> statement-breakpoint
-- Cast scheduling FK columns from text → uuid so they can reference public.User(id)
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='scheduling' AND table_name='psychologist_profile' AND column_name='user_id')='text' THEN ALTER TABLE scheduling.psychologist_profile ALTER COLUMN user_id TYPE uuid USING user_id::uuid; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='scheduling' AND table_name='availability' AND column_name='psychologist_id')='text' THEN ALTER TABLE scheduling.availability ALTER COLUMN psychologist_id TYPE uuid USING psychologist_id::uuid; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='scheduling' AND table_name='appointment' AND column_name='patient_id')='text' THEN ALTER TABLE scheduling.appointment ALTER COLUMN patient_id TYPE uuid USING patient_id::uuid; END IF; END $$;--> statement-breakpoint
DO $$ BEGIN IF (SELECT data_type FROM information_schema.columns WHERE table_schema='scheduling' AND table_name='appointment' AND column_name='psychologist_id')='text' THEN ALTER TABLE scheduling.appointment ALTER COLUMN psychologist_id TYPE uuid USING psychologist_id::uuid; END IF; END $$;--> statement-breakpoint
-- Remap appointments/profiles where same user has different IDs in each system
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT su.id::uuid AS scheduling_id, pu.id AS canonical_id
    FROM scheduling.user su
    JOIN "User" pu ON LOWER(pu.email) = LOWER(su.email)
    WHERE su.id::uuid != pu.id
  LOOP
    UPDATE scheduling.psychologist_profile SET user_id         = r.canonical_id WHERE user_id         = r.scheduling_id;
    UPDATE scheduling.availability          SET psychologist_id = r.canonical_id WHERE psychologist_id = r.scheduling_id;
    UPDATE scheduling.appointment           SET patient_id      = r.canonical_id WHERE patient_id      = r.scheduling_id;
    UPDATE scheduling.appointment           SET psychologist_id = r.canonical_id WHERE psychologist_id = r.scheduling_id;
  END LOOP;
END $$;--> statement-breakpoint
-- Add new FK constraints pointing to public.User
DO $$ BEGIN ALTER TABLE scheduling.psychologist_profile ADD CONSTRAINT psychologist_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE scheduling.availability ADD CONSTRAINT availability_psychologist_id_fkey FOREIGN KEY (psychologist_id) REFERENCES "User"(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE scheduling.appointment ADD CONSTRAINT appointment_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES "User"(id); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE scheduling.appointment ADD CONSTRAINT appointment_psychologist_id_fkey FOREIGN KEY (psychologist_id) REFERENCES "User"(id); EXCEPTION WHEN duplicate_object THEN null; END $$;