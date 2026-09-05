import "server-only";

import { and, count, eq, gt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/queries";
import {
  organization,
  organizationAiChatGrant,
  organizationContract,
  organizationMembership,
  organizationSessionCredit,
  programRun,
} from "@/lib/db/schema";
import { roleCanAccessProgram, type OrganizationRole } from "./policy";

export type { OrganizationRole } from "./policy";

export function organizationFeatureEnabled() {
  return process.env.ORGANIZATION_FEATURE_ENABLED === "true";
}

export async function resolveOrganizationEntitlements(
  userId: string,
  now = new Date()
) {
  if (!organizationFeatureEnabled()) return null;
  const [access] = await db
    .select({
      membership: organizationMembership,
      organization,
      contract: organizationContract,
    })
    .from(organizationMembership)
    .innerJoin(
      organization,
      and(
        eq(organization.id, organizationMembership.organizationId),
        eq(organization.status, "ACTIVE")
      )
    )
    .innerJoin(
      organizationContract,
      and(
        eq(organizationContract.organizationId, organization.id),
        eq(organizationContract.status, "ACTIVE"),
        lte(organizationContract.startsAt, now),
        gt(organizationContract.endsAt, now)
      )
    )
    .where(
      and(
        eq(organizationMembership.userId, userId),
        eq(organizationMembership.status, "ACTIVE")
      )
    )
    .limit(1);
  if (!access) return null;
  const [chatGrant] = await db
    .select()
    .from(organizationAiChatGrant)
    .where(
      and(
        eq(organizationAiChatGrant.membershipId, access.membership.id),
        eq(organizationAiChatGrant.status, "ACTIVE"),
        lte(organizationAiChatGrant.startsAt, now),
        gt(organizationAiChatGrant.endsAt, now)
      )
    )
    .limit(1);
  const [sessionStats] = await db
    .select({
      available: sql<number>`count(*) filter (where ${organizationSessionCredit.status} = 'AVAILABLE')`,
      reserved: sql<number>`count(*) filter (where ${organizationSessionCredit.status} = 'RESERVED')`,
      used: sql<number>`count(*) filter (where ${organizationSessionCredit.status} = 'USED')`,
    })
    .from(organizationSessionCredit)
    .where(
      and(
        eq(organizationSessionCredit.membershipId, access.membership.id),
        eq(organizationSessionCredit.contractId, access.contract.id)
      )
    );
  return {
    ...access,
    chatGrant: chatGrant ?? null,
    sessionStats: sessionStats ?? { available: 0, reserved: 0, used: 0 },
  };
}

export async function getDirectorOrganizationSummary(
  organizationId: string,
  contractId: string
) {
  const [[members], [started], [completed], [sessionCredits], [chatGrants]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(organizationMembership)
        .where(
          and(
            eq(organizationMembership.organizationId, organizationId),
            eq(organizationMembership.status, "ACTIVE")
          )
        ),
      db
        .select({ value: count() })
        .from(programRun)
        .where(
          and(
            eq(programRun.organizationId, organizationId),
            eq(programRun.organizationContractId, contractId)
          )
        ),
      db
        .select({ value: count() })
        .from(programRun)
        .where(
          and(
            eq(programRun.organizationId, organizationId),
            eq(programRun.organizationContractId, contractId),
            eq(programRun.status, "COMPLETED")
          )
        ),
      db
        .select({
          total: count(),
          used: sql<number>`count(*) filter (where ${organizationSessionCredit.status} = 'USED')`,
          available: sql<number>`count(*) filter (where ${organizationSessionCredit.status} = 'AVAILABLE')`,
        })
        .from(organizationSessionCredit)
        .where(eq(organizationSessionCredit.contractId, contractId)),
      db
        .select({
          total: count(),
          active: sql<number>`count(*) filter (where ${organizationAiChatGrant.status} = 'ACTIVE')`,
        })
        .from(organizationAiChatGrant)
        .where(eq(organizationAiChatGrant.contractId, contractId)),
    ]);
  return {
    activeMembers: Number(members?.value ?? 0),
    programRunsStarted: Number(started?.value ?? 0),
    programRunsCompleted: Number(completed?.value ?? 0),
    sessionCredits: {
      total: Number(sessionCredits?.total ?? 0),
      used: Number(sessionCredits?.used ?? 0),
      available: Number(sessionCredits?.available ?? 0),
    },
    aiChatGrants: {
      total: Number(chatGrants?.total ?? 0),
      active: Number(chatGrants?.active ?? 0),
    },
  };
}

export function canAccessOrganizationProgram(
  access: Awaited<ReturnType<typeof resolveOrganizationEntitlements>>,
  roles: string[]
) {
  return Boolean(
    access &&
      roleCanAccessProgram(
        access.membership.organizationRole as OrganizationRole,
        roles
      )
  );
}
