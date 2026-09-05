CREATE TABLE IF NOT EXISTS "Organization" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(300) NOT NULL,
  "joinCode" varchar(80) NOT NULL UNIQUE, status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Organization_status_check" CHECK (status IN ('ACTIVE','SUSPENDED'))
);
CREATE INDEX IF NOT EXISTS "Organization_status_name_idx" ON "Organization" (status,name);

CREATE TABLE IF NOT EXISTS "OrganizationSettings" (
  id varchar(32) PRIMARY KEY DEFAULT 'default', "sessionRate" integer NOT NULL DEFAULT 100000,
  "aiChatSeatPrice" integer NOT NULL DEFAULT 0, "quoteValidityDays" integer NOT NULL DEFAULT 14,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationSettings_values_check" CHECK ("sessionRate" >= 0 AND "aiChatSeatPrice" >= 0 AND "quoteValidityDays" BETWEEN 1 AND 90)
);
INSERT INTO "OrganizationSettings" (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS "OrganizationPricingTier" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "durationMonths" integer NOT NULL,
  "minEmployees" integer NOT NULL, "maxEmployees" integer NOT NULL, "maxPrograms" integer NOT NULL,
  "basePrice" integer NOT NULL, active boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationPricingTier_values_check" CHECK ("durationMonths" IN (1,3,6,12) AND "minEmployees" > 0 AND "maxEmployees" >= "minEmployees" AND "maxPrograms" > 0 AND "basePrice" >= 0),
  CONSTRAINT "OrganizationPricingTier_duration_employees_unique" UNIQUE ("durationMonths","minEmployees","maxEmployees")
);
CREATE INDEX IF NOT EXISTS "OrganizationPricingTier_active_duration_idx" ON "OrganizationPricingTier" (active,"durationMonths");

CREATE TABLE IF NOT EXISTS "OrganizationJoinRequest" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "userId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "organizationId" uuid REFERENCES "Organization"(id) ON DELETE SET NULL,
  "requestedOrganizationName" varchar(300) NOT NULL, "joinCode" varchar(80),
  status varchar(20) NOT NULL DEFAULT 'PENDING', "reviewedById" uuid REFERENCES "User"(id) ON DELETE SET NULL,
  "reviewedAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationJoinRequest_status_check" CHECK (status IN ('PENDING','APPROVED','REJECTED'))
);
CREATE INDEX IF NOT EXISTS "OrganizationJoinRequest_user_status_idx" ON "OrganizationJoinRequest" ("userId",status);
CREATE INDEX IF NOT EXISTS "OrganizationJoinRequest_status_created_idx" ON "OrganizationJoinRequest" (status,"createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationJoinRequest_one_pending_user_idx" ON "OrganizationJoinRequest" ("userId") WHERE status='PENDING';

CREATE TABLE IF NOT EXISTS "OrganizationMembership" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "organizationId" uuid NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "organizationRole" varchar(20) NOT NULL DEFAULT 'EMPLOYEE',
  status varchar(20) NOT NULL DEFAULT 'ACTIVE', "joinedAt" timestamptz NOT NULL DEFAULT now(), "endedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationMembership_role_check" CHECK ("organizationRole" IN ('EMPLOYEE','MANAGER','DIRECTOR')),
  CONSTRAINT "OrganizationMembership_status_check" CHECK (status IN ('ACTIVE','SUSPENDED','ENDED')),
  CONSTRAINT "OrganizationMembership_organization_user_unique" UNIQUE ("organizationId","userId")
);
CREATE INDEX IF NOT EXISTS "OrganizationMembership_user_status_idx" ON "OrganizationMembership" ("userId",status);
CREATE INDEX IF NOT EXISTS "OrganizationMembership_organization_status_idx" ON "OrganizationMembership" ("organizationId",status);
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMembership_one_active_user_idx" ON "OrganizationMembership" ("userId") WHERE status='ACTIVE';

CREATE TABLE IF NOT EXISTS "OrganizationQuote" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "quoteNumber" varchar(40) NOT NULL UNIQUE,
  "organizationName" varchar(300) NOT NULL, "contactName" varchar(200) NOT NULL, email varchar(320) NOT NULL, phone varchar(40) NOT NULL,
  "employeeCount" integer NOT NULL, "durationMonths" integer NOT NULL, "selectedProgramCount" integer NOT NULL DEFAULT 0,
  "sessionCreditCount" integer NOT NULL DEFAULT 0, "aiChatSeatCount" integer NOT NULL DEFAULT 0,
  "pricingTierId" uuid REFERENCES "OrganizationPricingTier"(id) ON DELETE SET NULL,
  "tokenHash" varchar(64) NOT NULL UNIQUE, "requestIpHash" varchar(64),
  "emailIdempotencyKey" varchar(100) NOT NULL UNIQUE, "emailStatus" varchar(20) NOT NULL DEFAULT 'PENDING', "emailSentAt" timestamptz,
  status varchar(20) NOT NULL DEFAULT 'SUBMITTED', subtotal integer NOT NULL,
  "totalAmount" integer NOT NULL, "expiresAt" timestamptz NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationQuote_status_check" CHECK (status IN ('SUBMITTED','CONVERTED','DECLINED','EXPIRED')),
  CONSTRAINT "OrganizationQuote_counts_check" CHECK ("employeeCount">0 AND "durationMonths" IN (1,3,6,12) AND "selectedProgramCount">=0 AND "sessionCreditCount">=0 AND "aiChatSeatCount">=0 AND subtotal>=0 AND "totalAmount">=0)
);
CREATE INDEX IF NOT EXISTS "OrganizationQuote_email_created_idx" ON "OrganizationQuote" (email,"createdAt");
CREATE INDEX IF NOT EXISTS "OrganizationQuote_status_created_idx" ON "OrganizationQuote" (status,"createdAt");

CREATE TABLE IF NOT EXISTS "OrganizationQuoteItem" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "quoteId" uuid NOT NULL REFERENCES "OrganizationQuote"(id) ON DELETE CASCADE,
  type varchar(30) NOT NULL, "sourceId" uuid, title varchar(300) NOT NULL, description text,
  quantity integer NOT NULL DEFAULT 1, "unitPrice" integer NOT NULL DEFAULT 0, "totalPrice" integer NOT NULL DEFAULT 0,
  "sortOrder" integer NOT NULL DEFAULT 0,
  CONSTRAINT "OrganizationQuoteItem_type_check" CHECK (type IN ('BASE_PACKAGE','INCLUDED_PROGRAM','CORPORATE_OFFER','SESSION_CREDIT','AI_CHAT_SEAT')),
  CONSTRAINT "OrganizationQuoteItem_values_check" CHECK (quantity>0 AND "unitPrice">=0 AND "totalPrice">=0)
);
CREATE INDEX IF NOT EXISTS "OrganizationQuoteItem_quote_idx" ON "OrganizationQuoteItem" ("quoteId","sortOrder");

CREATE TABLE IF NOT EXISTS "OrganizationContract" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "organizationId" uuid NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "sourceQuoteId" uuid REFERENCES "OrganizationQuote"(id) ON DELETE SET NULL, "durationMonths" integer NOT NULL,
  "employeeLimit" integer NOT NULL, "sessionCreditLimit" integer NOT NULL DEFAULT 0, "aiChatSeatLimit" integer NOT NULL DEFAULT 0,
  "totalAmount" integer NOT NULL, status varchar(20) NOT NULL DEFAULT 'DRAFT', "startsAt" timestamptz NOT NULL,
  "endsAt" timestamptz NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationContract_status_check" CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','EXPIRED')),
  CONSTRAINT "OrganizationContract_values_check" CHECK ("durationMonths" IN (1,3,6,12) AND "employeeLimit">0 AND "sessionCreditLimit">=0 AND "aiChatSeatLimit">=0 AND "totalAmount">=0 AND "endsAt">"startsAt")
);
CREATE INDEX IF NOT EXISTS "OrganizationContract_organization_status_dates_idx" ON "OrganizationContract" ("organizationId",status,"startsAt","endsAt");

CREATE TABLE IF NOT EXISTS "CorporateOffer" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "psychologistId" uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title varchar(300) NOT NULL, description text NOT NULL, price integer NOT NULL, status varchar(20) NOT NULL DEFAULT 'DRAFT',
  "submittedAt" timestamptz, "publishedAt" timestamptz, "approvedById" uuid REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "CorporateOffer_status_check" CHECK (status IN ('DRAFT','PENDING','PUBLISHED','ARCHIVED')),
  CONSTRAINT "CorporateOffer_price_check" CHECK (price>=0)
);
CREATE INDEX IF NOT EXISTS "CorporateOffer_owner_status_idx" ON "CorporateOffer" ("psychologistId",status);

CREATE TABLE IF NOT EXISTS "OrganizationAiChatGrant" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "contractId" uuid NOT NULL REFERENCES "OrganizationContract"(id) ON DELETE CASCADE,
  "organizationId" uuid NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "membershipId" uuid NOT NULL REFERENCES "OrganizationMembership"(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE', "startsAt" timestamptz NOT NULL, "endsAt" timestamptz NOT NULL,
  "assignedById" uuid REFERENCES "User"(id) ON DELETE SET NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationAiChatGrant_status_check" CHECK (status IN ('ACTIVE','REVOKED','EXPIRED')),
  CONSTRAINT "OrganizationAiChatGrant_dates_check" CHECK ("endsAt">"startsAt"),
  CONSTRAINT "OrganizationAiChatGrant_contract_membership_unique" UNIQUE ("contractId","membershipId")
);
CREATE INDEX IF NOT EXISTS "OrganizationAiChatGrant_membership_dates_idx" ON "OrganizationAiChatGrant" ("membershipId",status,"startsAt","endsAt");

CREATE TABLE IF NOT EXISTS "OrganizationSessionCredit" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "contractId" uuid NOT NULL REFERENCES "OrganizationContract"(id) ON DELETE CASCADE,
  "organizationId" uuid NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "membershipId" uuid NOT NULL REFERENCES "OrganizationMembership"(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'AVAILABLE', "appointmentId" text UNIQUE,
  "assignedById" uuid REFERENCES "User"(id) ON DELETE SET NULL, "reservedAt" timestamptz, "usedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "OrganizationSessionCredit_status_check" CHECK (status IN ('AVAILABLE','RESERVED','USED','VOID')),
  CONSTRAINT "OrganizationSessionCredit_contract_membership_unique" UNIQUE ("contractId","membershipId")
);
CREATE INDEX IF NOT EXISTS "OrganizationSessionCredit_member_status_idx" ON "OrganizationSessionCredit" ("membershipId",status);

CREATE TABLE IF NOT EXISTS "CorporatePsychologistLedger" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "appointmentId" text NOT NULL UNIQUE,
  "organizationId" uuid NOT NULL REFERENCES "Organization"(id), "contractId" uuid NOT NULL REFERENCES "OrganizationContract"(id),
  "psychologistId" uuid NOT NULL REFERENCES "User"(id), amount integer NOT NULL, status varchar(20) NOT NULL DEFAULT 'ACCRUED',
  "payoutReference" varchar(200), "paidAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "CorporatePsychologistLedger_status_check" CHECK (status IN ('ACCRUED','PAYABLE','REVERSED','PAID')),
  CONSTRAINT "CorporatePsychologistLedger_amount_check" CHECK (amount>=0)
);
CREATE INDEX IF NOT EXISTS "CorporatePsychologistLedger_psychologist_status_idx" ON "CorporatePsychologistLedger" ("psychologistId",status);

CREATE TABLE IF NOT EXISTS "OrganizationAuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "organizationId" uuid REFERENCES "Organization"(id) ON DELETE SET NULL,
  "actorId" uuid REFERENCES "User"(id) ON DELETE SET NULL, action varchar(100) NOT NULL, "entityType" varchar(80) NOT NULL,
  "entityId" varchar(100), before jsonb, after jsonb, "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "OrganizationAuditLog_organization_created_idx" ON "OrganizationAuditLog" ("organizationId","createdAt");

ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS audience varchar(20) NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "organizationRoles" text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE "Program" DROP CONSTRAINT IF EXISTS "Program_audience_check";
ALTER TABLE "Program" ADD CONSTRAINT "Program_audience_check" CHECK (audience IN ('INDIVIDUAL','ORGANIZATION'));
ALTER TABLE "Program" DROP CONSTRAINT IF EXISTS "Program_organization_roles_check";
ALTER TABLE "Program" ADD CONSTRAINT "Program_organization_roles_check" CHECK ("organizationRoles" <@ ARRAY['EMPLOYEE','MANAGER','DIRECTOR']::text[]);

ALTER TABLE "ProgramRun" ADD COLUMN IF NOT EXISTS "organizationId" uuid REFERENCES "Organization"(id) ON DELETE SET NULL;
ALTER TABLE "ProgramRun" ADD COLUMN IF NOT EXISTS "organizationContractId" uuid REFERENCES "OrganizationContract"(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "ProgramRun_organization_contract_status_idx" ON "ProgramRun" ("organizationId","organizationContractId",status);

ALTER TABLE scheduling.psychologist_profile ADD COLUMN IF NOT EXISTS corporate_partner_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE scheduling.psychologist_profile ADD COLUMN IF NOT EXISTS corporate_rate_accepted integer;
ALTER TABLE scheduling.psychologist_profile ADD COLUMN IF NOT EXISTS corporate_rate_accepted_at timestamptz;
ALTER TABLE scheduling.appointment ADD COLUMN IF NOT EXISTS funding_source varchar(30) NOT NULL DEFAULT 'PERSONAL_QPAY';
ALTER TABLE scheduling.appointment DROP CONSTRAINT IF EXISTS appointment_funding_source_check;
ALTER TABLE scheduling.appointment ADD CONSTRAINT appointment_funding_source_check CHECK (funding_source IN ('PERSONAL_QPAY','ORGANIZATION_CREDIT'));

DO $$ BEGIN
  ALTER TABLE "OrganizationSessionCredit" ADD CONSTRAINT "OrganizationSessionCredit_appointment_fk" FOREIGN KEY ("appointmentId") REFERENCES scheduling.appointment(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "CorporatePsychologistLedger" ADD CONSTRAINT "CorporatePsychologistLedger_appointment_fk" FOREIGN KEY ("appointmentId") REFERENCES scheduling.appointment(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
