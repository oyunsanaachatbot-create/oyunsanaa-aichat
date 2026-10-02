-- Organization program v1. Shared by the website (Prisma) and employee app (Drizzle).
-- Apply once to the verified shared database before either app serves v1 routes.
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "privacyMinimum" integer NOT NULL DEFAULT 3;

CREATE TABLE IF NOT EXISTS public."OrganizationContentItem" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(40) NOT NULL,
  title varchar(500) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  "createdById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "OrganizationContentItem_type_status_idx" ON public."OrganizationContentItem" (type,status);

CREATE TABLE IF NOT EXISTS public."OrganizationContentVersion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "itemId" uuid NOT NULL REFERENCES public."OrganizationContentItem"(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  payload jsonb NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  direction varchar(200),
  "createdById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationContentVersion_item_version_key" UNIQUE ("itemId",version)
);

CREATE TABLE IF NOT EXISTS public."OrganizationProgramTemplate" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(240) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  "createdById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public."OrganizationProgramTemplateVersion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" uuid NOT NULL REFERENCES public."OrganizationProgramTemplate"(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  definition jsonb NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationProgramTemplateVersion_template_version_key" UNIQUE ("templateId",version)
);

CREATE TABLE IF NOT EXISTS public."OrganizationProgramInstance" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "contractId" uuid NOT NULL REFERENCES public."OrganizationContract"(id) ON DELETE CASCADE,
  "assignedMembershipId" uuid REFERENCES public."OrganizationMembership"(id) ON DELETE SET NULL,
  "enrollmentMode" varchar(20) NOT NULL DEFAULT 'ALL' CHECK ("enrollmentMode" IN ('ALL','SELECTED')),
  "templateVersionId" uuid REFERENCES public."OrganizationProgramTemplateVersion"(id) ON DELETE SET NULL,
  "sourceProgramVersionId" uuid REFERENCES public."ProgramVersion"(id) ON DELETE SET NULL,
  name varchar(240) NOT NULL,
  "startDate" varchar(10) NOT NULL,
  "durationDays" integer NOT NULL CHECK ("durationDays" BETWEEN 1 AND 365),
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  tags text[] NOT NULL DEFAULT '{}',
  note text,
  "createdById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationProgramInstance_start_date_check" CHECK ("startDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);
CREATE INDEX IF NOT EXISTS "OrganizationProgramInstance_org_status_idx" ON public."OrganizationProgramInstance" ("organizationId","contractId",status);

CREATE TABLE IF NOT EXISTS public."OrganizationProgramEnrollment" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instanceId" uuid NOT NULL REFERENCES public."OrganizationProgramInstance"(id) ON DELETE CASCADE,
  "membershipId" uuid NOT NULL REFERENCES public."OrganizationMembership"(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  "assignedById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "assignedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationProgramEnrollment_instance_member_key" UNIQUE ("instanceId","membershipId")
);

CREATE TABLE IF NOT EXISTS public."OrganizationProgramBlock" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instanceId" uuid NOT NULL REFERENCES public."OrganizationProgramInstance"(id) ON DELETE CASCADE,
  "slotId" varchar(64) NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  "dayNumber" integer NOT NULL CHECK ("dayNumber" BETWEEN 1 AND 365),
  "sortOrder" integer NOT NULL DEFAULT 0,
  type varchar(40) NOT NULL,
  "sourceType" varchar(20) NOT NULL DEFAULT 'INLINE',
  "contentVersionId" uuid REFERENCES public."OrganizationContentVersion"(id) ON DELETE SET NULL,
  "payloadSnapshot" jsonb NOT NULL,
  audience text[] NOT NULL DEFAULT '{}',
  required boolean NOT NULL DEFAULT false,
  "publishState" varchar(20) NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationProgramBlock_slot_revision_key" UNIQUE ("instanceId","slotId",revision)
);
CREATE INDEX IF NOT EXISTS "OrganizationProgramBlock_instance_day_idx" ON public."OrganizationProgramBlock" ("instanceId","dayNumber","publishState","sortOrder");

CREATE TABLE IF NOT EXISTS public."OrganizationBlockRecipient" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "blockId" uuid NOT NULL REFERENCES public."OrganizationProgramBlock"(id) ON DELETE CASCADE,
  "membershipId" uuid NOT NULL REFERENCES public."OrganizationMembership"(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "assignedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationBlockRecipient_block_member_key" UNIQUE ("blockId","membershipId")
);
CREATE INDEX IF NOT EXISTS "OrganizationBlockRecipient_member_idx" ON public."OrganizationBlockRecipient" ("membershipId","blockId");

CREATE TABLE IF NOT EXISTS public."OrganizationBlockResponse" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipientId" uuid NOT NULL UNIQUE REFERENCES public."OrganizationBlockRecipient"(id) ON DELETE CASCADE,
  value jsonb NOT NULL DEFAULT '{}',
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  "submittedAt" timestamptz,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."OrganizationActivityEvent" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instanceId" uuid NOT NULL REFERENCES public."OrganizationProgramInstance"(id) ON DELETE CASCADE,
  "blockId" uuid REFERENCES public."OrganizationProgramBlock"(id) ON DELETE SET NULL,
  "recipientId" uuid REFERENCES public."OrganizationBlockRecipient"(id) ON DELETE SET NULL,
  "userId" uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "dayNumber" integer NOT NULL,
  type varchar(40) NOT NULL,
  "idempotencyKey" varchar(180) NOT NULL UNIQUE,
  "occurredAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "OrganizationActivityEvent_instance_day_idx" ON public."OrganizationActivityEvent" ("instanceId","dayNumber",type);

CREATE TABLE IF NOT EXISTS public."OrganizationAssessmentAssignment" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipientId" uuid NOT NULL UNIQUE REFERENCES public."OrganizationBlockRecipient"(id) ON DELETE CASCADE,
  "programVersionId" uuid NOT NULL REFERENCES public."ProgramVersion"(id),
  role varchar(20) NOT NULL,
  "programRunId" uuid REFERENCES public."ProgramRun"(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'AVAILABLE'
);

CREATE TABLE IF NOT EXISTS public."OrganizationFeedback" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "contractId" uuid NOT NULL REFERENCES public."OrganizationContract"(id) ON DELETE CASCADE,
  destination varchar(20) NOT NULL CHECK (destination IN ('ORGANIZATION','OYUNSANAA')),
  body text NOT NULL,
  "idempotencyKey" uuid NOT NULL UNIQUE,
  status varchar(20) NOT NULL DEFAULT 'OPEN',
  "resolutionText" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS "OrganizationFeedback_inbox_idx" ON public."OrganizationFeedback" (destination,"organizationId",status,"createdAt");

CREATE TABLE IF NOT EXISTS public."OrganizationConclusion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "instanceId" uuid NOT NULL REFERENCES public."OrganizationProgramInstance"(id) ON DELETE CASCADE,
  kind varchar(30) NOT NULL,
  phase varchar(20),
  fields jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  "createdById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "approvedById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "approvedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS "OrganizationConclusion_instance_idx" ON public."OrganizationConclusion" ("instanceId",status);

CREATE TABLE IF NOT EXISTS public."OrganizationImplementation" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "instanceId" uuid REFERENCES public."OrganizationProgramInstance"(id) ON DELETE SET NULL,
  title varchar(500) NOT NULL,
  body text NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'PLANNED',
  evidence text,
  "createdById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "verifiedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS "OrganizationImplementation_org_status_idx" ON public."OrganizationImplementation" ("organizationId",status);

CREATE TABLE IF NOT EXISTS public."OrganizationSuggestionDecision" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "instanceId" uuid NOT NULL REFERENCES public."OrganizationProgramInstance"(id) ON DELETE CASCADE,
  "blockId" uuid NOT NULL UNIQUE REFERENCES public."OrganizationProgramBlock"(id) ON DELETE CASCADE,
  recommended jsonb NOT NULL DEFAULT '[]',
  selected jsonb NOT NULL DEFAULT '[]',
  status varchar(20) NOT NULL DEFAULT 'RECOMMENDED' CHECK (status IN ('RECOMMENDED','SELECTED','CONFIRMED','IMPLEMENTED')),
  evidence text,
  "confirmedById" uuid REFERENCES public."User"(id) ON DELETE SET NULL,
  "confirmedAt" timestamptz,
  "implementedAt" timestamptz
);

-- Legacy assignments have a stable UUID, which doubles as the new instance ID.
-- Catalog entries without an explicit assignment remain catalog entries only.
WITH pinned AS (
  SELECT a.*, v.id AS "versionId", v.definition,
    GREATEST(1, LEAST(365, GREATEST(
      CASE c."durationMonths" WHEN 1 THEN 30 WHEN 3 THEN 90 WHEN 6 THEN 180 WHEN 12 THEN 365 ELSE 30 END,
      COALESCE((SELECT max((d->>'dayNumber')::integer) FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(v.definition #> '{organization,days}') = 'array' THEN v.definition #> '{organization,days}' ELSE '[]'::jsonb END
      ) AS d WHERE d->>'dayNumber' ~ '^[0-9]+$'), 0)
    ))) AS "durationDays"
  FROM public."OrganizationProgramAssignment" a
  JOIN public."OrganizationContract" c ON c.id = a."contractId" AND c."organizationId" = a."organizationId"
  JOIN LATERAL (
    SELECT pv.id, pv.definition FROM public."ProgramVersion" pv
    WHERE pv."programId" = a."programId" AND pv.status = 'PUBLISHED'
    ORDER BY pv.version DESC LIMIT 1
  ) v ON true
  JOIN public."Program" p ON p.id = a."programId" AND p.audience = 'ORGANIZATION' AND p.status = 'PUBLISHED'
  WHERE a.status IN ('PLANNED','ACTIVE','COMPLETED')
)
INSERT INTO public."OrganizationProgramInstance"
  (id,"organizationId","contractId","assignedMembershipId","enrollmentMode","sourceProgramVersionId",name,"startDate","durationDays",status,"createdById","publishedAt","createdAt")
SELECT p.id,p."organizationId",p."contractId",p."membershipId",
  CASE WHEN p."membershipId" IS NULL THEN 'ALL' ELSE 'SELECTED' END,p."versionId",
  LEFT(COALESCE(NULLIF(p.definition->>'title',''),'Байгууллагын хөтөлбөр'),240),
  to_char(p."startsAt" AT TIME ZONE 'Asia/Ulaanbaatar','YYYY-MM-DD'),p."durationDays",
  CASE WHEN p.status = 'COMPLETED' THEN 'COMPLETED' ELSE 'ACTIVE' END,
  p."createdById",p."createdAt",p."createdAt"
FROM pinned p ON CONFLICT (id) DO NOTHING;

-- Preserve the authored block and its legacy identifier in the immutable snapshot.
WITH source_blocks AS (
  SELECT i.id AS "instanceId", (day.value->>'dayNumber')::integer AS "dayNumber",
    block.value AS old, (block.ordinality - 1)::integer AS "sortOrder"
  FROM public."OrganizationProgramInstance" i
  JOIN public."ProgramVersion" v ON v.id = i."sourceProgramVersionId"
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(v.definition #> '{organization,days}') = 'array' THEN v.definition #> '{organization,days}' ELSE '[]'::jsonb END
  ) day(value)
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(day.value->'blocks') = 'array' THEN day.value->'blocks' ELSE '[]'::jsonb END
  ) WITH ORDINALITY block(value,ordinality)
  WHERE day.value->>'dayNumber' ~ '^[0-9]+$'
    AND (day.value->>'dayNumber')::integer BETWEEN 1 AND i."durationDays"
    AND block.value->>'id' IS NOT NULL
)
INSERT INTO public."OrganizationProgramBlock"
  ("instanceId","slotId",revision,"dayNumber","sortOrder",type,"sourceType","payloadSnapshot",audience,required,"publishState")
SELECT s."instanceId",md5(s."dayNumber"::text || ':' || (s.old->>'id') || ':' || s."sortOrder"::text),1,s."dayNumber",s."sortOrder",
  CASE s.old->>'type'
    WHEN 'OYUNSANAA_MESSAGE' THEN 'WORD_PACK' WHEN 'CHECK_IN' THEN 'CHECK_IN'
    WHEN 'QUESTION' THEN CASE WHEN s.old->>'responseUse' = 'PERSONAL' THEN 'PERSONAL_QUESTION' ELSE 'ORGANIZATION_QUESTION' END
    WHEN 'APPRECIATION' THEN 'GRATITUDE' WHEN 'SURPRISE' THEN 'SUGGESTION'
    WHEN 'MESSAGE' THEN 'MANAGER_MESSAGE' WHEN 'AUDIO' THEN 'AUDIO'
    WHEN 'QUIZ' THEN 'SURVEY' WHEN 'TRAINING' THEN 'TRAINING'
    WHEN 'PROGRAM' THEN 'PROGRAM' WHEN 'TASK' THEN 'TASK' ELSE 'WORD_PACK' END,
  'INLINE', jsonb_build_object(
    'title',COALESCE(NULLIF(s.old->>'title',''),NULLIF(s.old->>'prompt',''),'Хөтөлбөрийн хэсэг'),
    'body',COALESCE(s.old->>'body',''), 'prompt',COALESCE(s.old->>'prompt',''),
    'responseType',CASE WHEN s.old->>'responseType' = 'SCALE' THEN 'SCALE_1_5' ELSE COALESCE(s.old->>'responseType','NONE') END,
    'options',COALESCE(s.old->'options','[]'::jsonb),
    'audioUrl',s.old->>'audioUrl', 'linkedProgramId',s.old->>'linkedProgramId',
    'legacyBlockId',s.old->>'id', 'legacyResponseUse',s.old->>'responseUse',
    'questions',CASE WHEN s.old->>'type' = 'QUIZ' THEN jsonb_build_array(jsonb_build_object(
      'id','legacy','prompt',COALESCE(NULLIF(s.old->>'prompt',''),s.old->>'title','Асуулт'),
      'responseType',CASE WHEN s.old->>'responseType' = 'SCALE' THEN 'SCALE_1_5' ELSE COALESCE(s.old->>'responseType','TEXT') END,
      'options',COALESCE(s.old->'options','[]'::jsonb)
    )) ELSE '[]'::jsonb END
  ),ARRAY['EXECUTIVE','MANAGER','TEAM_LEAD','EMPLOYEE','SUPPORT']::text[],
  COALESCE((s.old->>'required')::boolean,false),'PUBLISHED'
FROM source_blocks s
ON CONFLICT ("instanceId","slotId",revision) DO NOTHING;

INSERT INTO public."OrganizationSuggestionDecision" ("organizationId","instanceId","blockId",recommended)
SELECT i."organizationId",i.id,b.id,COALESCE(b."payloadSnapshot"->'options','[]'::jsonb)
FROM public."OrganizationProgramBlock" b
JOIN public."OrganizationProgramInstance" i ON i.id=b."instanceId"
WHERE b.type='SUGGESTION' AND b."publishState"='PUBLISHED' AND i."sourceProgramVersionId" IS NOT NULL
ON CONFLICT ("blockId") DO NOTHING;

-- Materialize historical eligibility once. Future late joiners are appended by the apps
-- on the current day; old recipient rows are never removed or recalculated.
INSERT INTO public."OrganizationBlockRecipient" ("blockId","membershipId","userId")
SELECT b.id,m.id,m."userId"
FROM public."OrganizationProgramBlock" b
JOIN public."OrganizationProgramInstance" i ON i.id=b."instanceId" AND i."sourceProgramVersionId" IS NOT NULL
CROSS JOIN LATERAL (
  SELECT array_agg(candidate.id ORDER BY candidate."joinedAt",candidate.id) AS ids
  FROM public."OrganizationMembership" candidate
  WHERE candidate."organizationId"=i."organizationId"
    AND candidate."joinedAt" < ((i."startDate"::date + (b."dayNumber" - 1))::timestamp AT TIME ZONE 'Asia/Ulaanbaatar') + interval '1 day'
    AND (candidate."endedAt" IS NULL OR candidate."endedAt" > ((i."startDate"::date + (b."dayNumber" - 1))::timestamp AT TIME ZONE 'Asia/Ulaanbaatar'))
) spotlight
JOIN public."OrganizationMembership" m ON m."organizationId"=i."organizationId"
  AND (i."assignedMembershipId" IS NULL OR i."assignedMembershipId"=m.id)
  AND m."joinedAt" < ((i."startDate"::date + (b."dayNumber" - 1))::timestamp AT TIME ZONE 'Asia/Ulaanbaatar') + interval '1 day'
  AND (m."endedAt" IS NULL OR m."endedAt" > ((i."startDate"::date + (b."dayNumber" - 1))::timestamp AT TIME ZONE 'Asia/Ulaanbaatar'))
WHERE b."publishState"='PUBLISHED'
  AND (b.type <> 'GRATITUDE' OR m.id <> spotlight.ids[1 + ((b."dayNumber" - 1) % cardinality(spotlight.ids))])
ON CONFLICT ("blockId","membershipId") DO NOTHING;

INSERT INTO public."OrganizationProgramEnrollment" ("instanceId","membershipId")
SELECT DISTINCT b."instanceId",r."membershipId"
FROM public."OrganizationBlockRecipient" r
JOIN public."OrganizationProgramBlock" b ON b.id=r."blockId"
JOIN public."OrganizationProgramInstance" i ON i.id=b."instanceId" AND i."sourceProgramVersionId" IS NOT NULL
ON CONFLICT ("instanceId","membershipId") DO NOTHING;

-- Only unique legacy IDs on the same dated day are safe to convert.
-- Unmatched or ambiguous OrganizationDayProgress rows remain read-only in the legacy table.
WITH matched AS (
  SELECT p.id AS "progressId",p.status,p."completedAt",p."updatedAt",r.id AS "recipientId",b.type,
    answer.key,answer.value,
    count(*) OVER (PARTITION BY p.id,answer.key) AS matches
  FROM public."OrganizationDayProgress" p
  JOIN public."OrganizationProgramInstance" i ON i."organizationId"=p."organizationId"
    AND i."contractId"=p."contractId" AND i."sourceProgramVersionId" IN
      (SELECT id FROM public."ProgramVersion" WHERE "programId"=p."programId")
    AND (i."assignedMembershipId" IS NULL OR i."assignedMembershipId"=p."membershipId")
  JOIN public."OrganizationProgramBlock" b ON b."instanceId"=i.id AND b."dayNumber"=p."dayNumber"
  JOIN public."OrganizationBlockRecipient" r ON r."blockId"=b.id AND r."membershipId"=p."membershipId"
  CROSS JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(p.responses)='object' THEN p.responses ELSE '{}'::jsonb END) answer(key,value)
  WHERE b."payloadSnapshot"->>'legacyBlockId'=answer.key
)
INSERT INTO public."OrganizationBlockResponse" ("recipientId",value,status,"submittedAt","updatedAt")
SELECT m."recipientId",CASE WHEN m.type='SURVEY' THEN jsonb_build_object('legacy',m.value) ELSE m.value END,
  CASE WHEN m.status='COMPLETED' THEN 'SUBMITTED' ELSE 'DRAFT' END,
  CASE WHEN m.status='COMPLETED' THEN COALESCE(m."completedAt",m."updatedAt") ELSE NULL END,
  m."updatedAt"
FROM matched m WHERE m.matches=1
ON CONFLICT ("recipientId") DO NOTHING;

WITH matched_days AS (
  SELECT i.id AS "instanceId",p.id AS "progressId",p."userId",p."dayNumber",p."completedAt",p."updatedAt",
    count(*) OVER (PARTITION BY p.id) AS matches
  FROM public."OrganizationDayProgress" p
  JOIN public."OrganizationProgramInstance" i ON i."organizationId"=p."organizationId"
    AND i."contractId"=p."contractId" AND i."sourceProgramVersionId" IN
      (SELECT id FROM public."ProgramVersion" WHERE "programId"=p."programId")
    AND (i."assignedMembershipId" IS NULL OR i."assignedMembershipId"=p."membershipId")
  WHERE p.status='COMPLETED'
)
INSERT INTO public."OrganizationActivityEvent"
  ("instanceId","userId","dayNumber",type,"idempotencyKey","occurredAt")
SELECT d."instanceId",d."userId",d."dayNumber",'DAY_COMPLETED',
  'legacy-day:' || d."progressId"::text,COALESCE(d."completedAt",d."updatedAt")
FROM matched_days d WHERE d.matches=1
ON CONFLICT ("idempotencyKey") DO NOTHING;
