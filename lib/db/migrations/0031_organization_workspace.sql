-- Shared organization workspace and employee daily-progress records.
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "logoUrl" varchar(1000);
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "industry" varchar(300);
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "shiftWork" boolean NOT NULL DEFAULT false;
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "workMode" varchar(20) NOT NULL DEFAULT 'OFFICE';
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "branchCount" integer NOT NULL DEFAULT 1;
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "authorizedUser" varchar(300);
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "ageSummary" text;
ALTER TABLE public."Organization" ADD COLUMN IF NOT EXISTS "genderSummary" text;
ALTER TABLE public."OrganizationMembership" ADD COLUMN IF NOT EXISTS "employeeLevel" varchar(30) NOT NULL DEFAULT 'EMPLOYEE';
ALTER TABLE public."OrganizationMembership" ADD COLUMN IF NOT EXISTS "jobTitle" varchar(200);

CREATE TABLE IF NOT EXISTS public."OrganizationInvitation" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  name varchar(200) NOT NULL,
  "employeeLevel" varchar(30) NOT NULL DEFAULT 'EMPLOYEE',
  "jobTitle" varchar(200),
  "organizationRole" varchar(20) NOT NULL DEFAULT 'EMPLOYEE',
  "tokenHash" varchar(64) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  "expiresAt" timestamptz NOT NULL,
  "acceptedAt" timestamptz,
  "createdById" uuid,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationInvitation_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "OrganizationInvitation_role_check" CHECK ("organizationRole" IN ('EMPLOYEE','MANAGER','DIRECTOR')),
  CONSTRAINT "OrganizationInvitation_status_check" CHECK (status IN ('PENDING','ACCEPTED','REVOKED','EXPIRED'))
);
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_org_status_idx" ON public."OrganizationInvitation" ("organizationId", status, "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationInvitation_pending_email_idx" ON public."OrganizationInvitation" ("organizationId", lower(email)) WHERE status='PENDING';

CREATE TABLE IF NOT EXISTS public."OrganizationProgramAssignment" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "contractId" uuid NOT NULL REFERENCES public."OrganizationContract"(id) ON DELETE CASCADE,
  "programId" uuid NOT NULL REFERENCES public."Program"(id) ON DELETE CASCADE,
  "membershipId" uuid REFERENCES public."OrganizationMembership"(id) ON DELETE SET NULL,
  "startsAt" timestamptz NOT NULL,
  "endsAt" timestamptz,
  status varchar(20) NOT NULL DEFAULT 'PLANNED',
  "createdById" uuid,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationProgramAssignment_status_check" CHECK (status IN ('PLANNED','ACTIVE','COMPLETED','CANCELLED')),
  CONSTRAINT "OrganizationProgramAssignment_dates_check" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt")
);
CREATE INDEX IF NOT EXISTS "OrganizationProgramAssignment_org_status_idx" ON public."OrganizationProgramAssignment" ("organizationId", "contractId", status);

CREATE TABLE IF NOT EXISTS public."OrganizationActionItem" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  topic varchar(300), title varchar(500) NOT NULL, owner varchar(200), "dueAt" timestamptz,
  status varchar(20) NOT NULL DEFAULT 'OPEN', "createdById" uuid,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationActionItem_status_check" CHECK (status IN ('OPEN','IN_PROGRESS','DONE'))
);
CREATE INDEX IF NOT EXISTS "OrganizationActionItem_org_status_idx" ON public."OrganizationActionItem" ("organizationId", status, "dueAt");

CREATE TABLE IF NOT EXISTS public."OrganizationUpdate" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  type varchar(30) NOT NULL, body text NOT NULL, "createdById" uuid,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationUpdate_type_check" CHECK (type IN ('CHANGE','EMPLOYEE_COMMUNICATION'))
);
CREATE INDEX IF NOT EXISTS "OrganizationUpdate_org_type_idx" ON public."OrganizationUpdate" ("organizationId", type, "createdAt");

CREATE TABLE IF NOT EXISTS public."OrganizationDayProgress" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "contractId" uuid NOT NULL REFERENCES public."OrganizationContract"(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "membershipId" uuid NOT NULL REFERENCES public."OrganizationMembership"(id) ON DELETE CASCADE,
  "programId" uuid NOT NULL REFERENCES public."Program"(id) ON DELETE CASCADE,
  "dayNumber" integer NOT NULL CHECK ("dayNumber" BETWEEN 1 AND 366),
  responses jsonb NOT NULL DEFAULT '{}', status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" timestamptz NOT NULL DEFAULT now(), "completedAt" timestamptz,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationDayProgress_status_check" CHECK (status IN ('IN_PROGRESS','COMPLETED')),
  CONSTRAINT "OrganizationDayProgress_contract_user_day_key" UNIQUE ("contractId", "userId", "programId", "dayNumber")
);
CREATE INDEX IF NOT EXISTS "OrganizationDayProgress_org_status_idx" ON public."OrganizationDayProgress" ("organizationId", "contractId", status);

CREATE TABLE IF NOT EXISTS public."OrganizationAppreciation" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" uuid NOT NULL REFERENCES public."Organization"(id) ON DELETE CASCADE,
  "senderMembershipId" uuid NOT NULL REFERENCES public."OrganizationMembership"(id) ON DELETE CASCADE,
  "recipientMembershipId" uuid NOT NULL REFERENCES public."OrganizationMembership"(id) ON DELETE CASCADE,
  body varchar(1000) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationAppreciation_not_self_check" CHECK ("senderMembershipId" <> "recipientMembershipId")
);
CREATE INDEX IF NOT EXISTS "OrganizationAppreciation_recipient_idx" ON public."OrganizationAppreciation" ("recipientMembershipId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrganizationAppreciation_org_idx" ON public."OrganizationAppreciation" ("organizationId", "createdAt");
