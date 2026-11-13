ALTER TABLE "Program"
  ADD COLUMN IF NOT EXISTS "organizationDurationMonths" integer;

UPDATE "Program"
SET "organizationDurationMonths" = 1,
    "updatedAt" = now()
WHERE audience = 'ORGANIZATION'
  AND "organizationDurationMonths" IS NULL;

ALTER TABLE "Program"
  DROP CONSTRAINT IF EXISTS "Program_organization_duration_check";

ALTER TABLE "Program"
  ADD CONSTRAINT "Program_organization_duration_check"
  CHECK (
    (audience = 'INDIVIDUAL' AND "organizationDurationMonths" IS NULL)
    OR
    (audience = 'ORGANIZATION' AND "organizationDurationMonths" IN (1, 3, 6, 12))
  );

CREATE INDEX IF NOT EXISTS "Program_organization_duration_status_idx"
  ON "Program" (audience, "organizationDurationMonths", status, "sortOrder");
