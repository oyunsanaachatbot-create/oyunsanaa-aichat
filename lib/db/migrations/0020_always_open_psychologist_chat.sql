-- Restore names that already exist in the scheduling account table so the
-- psychologist inbox never has to identify a participant by email.
UPDATE public."User" AS app_user
SET name = scheduling_user.name
FROM scheduling."user" AS scheduling_user
WHERE lower(app_user.email) = lower(scheduling_user.email)
  AND nullif(btrim(app_user.name), '') IS NULL
  AND nullif(btrim(scheduling_user.name), '') IS NOT NULL;
--> statement-breakpoint
-- Direct psychologist conversations are asynchronous inboxes, not booked
-- session windows. Existing closed rows must therefore be writable again.
UPDATE psychologist_conversation
SET status = 'open'
WHERE status <> 'open';
