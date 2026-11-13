-- The designated online-chat operator needs administrator access so they can
-- answer every patient conversation while ordinary psychologists remain
-- limited to conversations assigned to them.
UPDATE public."User"
SET role = 'ADMIN'
WHERE id = 'fd9fc15d-f8d2-41ab-a74b-a8f97400406f'::uuid
  AND upper(role::text) <> 'ADMIN';
--> statement-breakpoint
-- Existing conversations may have been distributed to unrelated website
-- psychologists. Move all of them to the designated app inbox operator.
UPDATE psychologist_conversation
SET psychologist_id = 'fd9fc15d-f8d2-41ab-a74b-a8f97400406f'::uuid
WHERE psychologist_id <> 'fd9fc15d-f8d2-41ab-a74b-a8f97400406f'::uuid
  AND EXISTS (
    SELECT 1
    FROM public."User"
    WHERE id = 'fd9fc15d-f8d2-41ab-a74b-a8f97400406f'::uuid
      AND upper(role::text) = 'ADMIN'
  );
