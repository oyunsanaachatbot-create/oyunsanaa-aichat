import {
  missingRequiredResponseKeys,
  type ProgramDefinition,
  type ProgramResponses,
} from "./definition";

const DAILY_STAMP = /^__daily\.\d+\.completedAt$/;

export class ProgramRunConflictError extends Error {
  constructor() {
    super("run_revision_conflict");
  }
}

/** Client timestamps are never an authority for DAILY progression. */
export function canonicalDailyResponses({
  definition,
  stored,
  incoming,
  sectionId,
  completeDay,
  now = Date.now(),
}: {
  definition: ProgramDefinition;
  stored: ProgramResponses;
  incoming: ProgramResponses;
  sectionId: string;
  completeDay?: number;
  now?: number;
}): ProgramResponses | null {
  const clean = Object.fromEntries(
    Object.entries(incoming).filter(([key]) => !key.startsWith("__daily."))
  );
  if (definition.deliveryMode !== "DAILY") return clean;
  const duration = definition.durationDays ?? 1;
  let unlocked = 1;
  for (let day = 1; day < duration; day++) {
    const stamp = stored[`__daily.${day}.completedAt`];
    const time = typeof stamp === "string" ? Date.parse(stamp) : Number.NaN;
    if (!Number.isFinite(time) || now - time < 86_400_000) break;
    unlocked = day + 1;
  }
  const target = definition.sections.find(
    (section) => section.id === sectionId
  );
  if (!target || (target.dayNumber ?? 1) > unlocked) return null;
  if (
    definition.sections.some(
      (section) =>
        (section.dayNumber ?? 1) > unlocked &&
        Object.keys(clean).some((key) => key.startsWith(`${section.id}.`))
    )
  )
    return null;
  for (const [key, value] of Object.entries(stored))
    if (DAILY_STAMP.test(key)) clean[key] = value;
  if (completeDay !== undefined) {
    if (
      completeDay !== (target.dayNumber ?? 1) ||
      completeDay > unlocked ||
      completeDay > duration
    )
      return null;
    const sections = definition.sections.filter(
      (section) => (section.dayNumber ?? 1) === completeDay
    );
    if (
      missingRequiredResponseKeys(definition, clean).some((key) =>
        sections.some((section) => key.startsWith(`${section.id}.`))
      )
    )
      return null;
    const stampKey = `__daily.${completeDay}.completedAt`;
    clean[stampKey] = stored[stampKey] ?? new Date(now).toISOString();
  }
  return clean;
}
