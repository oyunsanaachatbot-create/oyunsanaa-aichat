ALTER TABLE "OrganizationSettings"
  ALTER COLUMN "aiChatSeatPrice" SET DEFAULT 30000;

UPDATE "OrganizationSettings"
SET "aiChatSeatPrice" = 30000,
    "updatedAt" = now()
WHERE id = 'default'
  AND "aiChatSeatPrice" = 0;
