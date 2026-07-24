-- Both applications treat email addresses case-insensitively. Normalize the
-- existing canonical users before enforcing the invariant for future writes.
UPDATE "User"
SET "email" = lower(trim("email"))
WHERE "email" <> lower(trim("email"));

ALTER TABLE "User"
ADD CONSTRAINT "User_email_unique" UNIQUE("email");
