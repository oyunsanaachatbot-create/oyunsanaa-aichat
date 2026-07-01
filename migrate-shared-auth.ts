/**
 * One-time migration: merge scheduling.user into public.User and repoint
 * all scheduling schema FK constraints to public.User.
 *
 * Run with:
 *   POSTGRES_URL="postgresql://sanaa:oyunsanaa123@167.233.115.147:5432/oyunsanaa" \
 *   npx tsx migrate-shared-auth.ts
 */

import postgres from "postgres";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { ssl: false, max: 1 });

async function main() {
  await sql.begin(async (tx) => {
    // ── 1. Add name and role columns to public."User" ──────────────────────
    await tx`
      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS name  VARCHAR(64),
        ADD COLUMN IF NOT EXISTS role  VARCHAR(20) NOT NULL DEFAULT 'PATIENT'
    `;
    console.log("✓ Added name/role columns to public.User");

    // ── 2. Insert scheduling users that don't yet exist in public.User ─────
    //    (use the same UUID so scheduling FK rows keep working unchanged)
    //    scheduling.user.id is text; public.User.id is uuid — cast explicitly.
    const inserted = await tx`
      INSERT INTO "User" (id, email, password, name, role, "trialStartedAt", "subscriptionStatus")
      SELECT
        su.id::uuid,
        LOWER(su.email),
        su.password_hash,
        su.name,
        su.role::text,
        NOW(),
        'trialing'
      FROM scheduling.user su
      WHERE NOT EXISTS (
        SELECT 1 FROM "User" pu WHERE LOWER(pu.email) = LOWER(su.email)
      )
      -- Exclude any scheduling user whose id already exists in public.User
      -- (shouldn't happen, but prevents uuid collision on rerun)
      AND NOT EXISTS (
        SELECT 1 FROM "User" pu WHERE pu.id = su.id::uuid
      )
      RETURNING id
    `;
    console.log(`✓ Inserted ${inserted.length} scheduling-only users into public.User`);

    // ── 3. Update name/role in public.User for users that exist in both ────
    await tx`
      UPDATE "User" pu
      SET
        name = su.name,
        role = su.role::text
      FROM scheduling.user su
      WHERE LOWER(pu.email) = LOWER(su.email)
        AND pu.name IS NULL
    `;
    console.log("✓ Synced name/role for dual-registered users");

    // ── 4. Drop old FK constraints BEFORE remapping ────────────────────────
    //    (old FKs reference scheduling.user; remap would violate them)
    await tx`ALTER TABLE scheduling.psychologist_profile DROP CONSTRAINT IF EXISTS psychologist_profile_user_id_fkey`;
    await tx`ALTER TABLE scheduling.availability          DROP CONSTRAINT IF EXISTS availability_psychologist_id_fkey`;
    await tx`ALTER TABLE scheduling.appointment           DROP CONSTRAINT IF EXISTS appointment_patient_id_fkey`;
    await tx`ALTER TABLE scheduling.appointment           DROP CONSTRAINT IF EXISTS appointment_psychologist_id_fkey`;
    // Also drop scheduling.user's PK so we can leave it without dangling FKs
    console.log("✓ Dropped old FK constraints");

    // ── 4a. Cast scheduling FK columns from text → uuid ──────────────────
    //    Prisma maps String to text; public.User.id is uuid — types must match.
    await tx`ALTER TABLE scheduling.psychologist_profile ALTER COLUMN user_id         TYPE uuid USING user_id::uuid`;
    await tx`ALTER TABLE scheduling.availability          ALTER COLUMN psychologist_id TYPE uuid USING psychologist_id::uuid`;
    await tx`ALTER TABLE scheduling.appointment           ALTER COLUMN patient_id      TYPE uuid USING patient_id::uuid`;
    await tx`ALTER TABLE scheduling.appointment           ALTER COLUMN psychologist_id TYPE uuid USING psychologist_id::uuid`;
    console.log("✓ Cast scheduling FK columns to uuid");

    // ── 5. For dual-registered users whose IDs differ, remap scheduling rows ─
    // After the CAST above, all FK columns are uuid. Compare uuid↔uuid.
    const dualUsers = await tx<{ scheduling_id: string; canonical_id: string }[]>`
      SELECT su.id::uuid AS scheduling_id, pu.id AS canonical_id
      FROM scheduling.user su
      JOIN "User" pu ON LOWER(pu.email) = LOWER(su.email)
      WHERE su.id::uuid != pu.id
    `;
    console.log(`✓ Found ${dualUsers.length} dual-ID users — remapping scheduling rows`);

    for (const { scheduling_id, canonical_id } of dualUsers) {
      await tx`UPDATE scheduling.psychologist_profile SET user_id         = ${canonical_id}::uuid WHERE user_id         = ${scheduling_id}::uuid`;
      await tx`UPDATE scheduling.availability          SET psychologist_id = ${canonical_id}::uuid WHERE psychologist_id = ${scheduling_id}::uuid`;
      await tx`UPDATE scheduling.appointment           SET patient_id      = ${canonical_id}::uuid WHERE patient_id      = ${scheduling_id}::uuid`;
      await tx`UPDATE scheduling.appointment           SET psychologist_id = ${canonical_id}::uuid WHERE psychologist_id = ${scheduling_id}::uuid`;
    }

    // ── 5b. Verify no dangling patient/psychologist IDs remain ───────────────
    const dangling = await tx<{ patient_id: string }[]>`
      SELECT DISTINCT ap.patient_id
      FROM scheduling.appointment ap
      WHERE ap.patient_id NOT IN (SELECT id FROM "User")
    `;
    if (dangling.length > 0) {
      throw new Error(
        `Migration aborted: ${dangling.length} appointment(s) have patient_id not in public.User: ` +
        dangling.map((r) => r.patient_id).join(", ")
      );
    }

    // ── 6. Add new FKs pointing to public."User" ───────────────────────────
    await tx`
      ALTER TABLE scheduling.psychologist_profile
        ADD CONSTRAINT psychologist_profile_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE
    `;
    await tx`
      ALTER TABLE scheduling.availability
        ADD CONSTRAINT availability_psychologist_id_fkey
        FOREIGN KEY (psychologist_id) REFERENCES "User"(id) ON DELETE CASCADE
    `;
    await tx`
      ALTER TABLE scheduling.appointment
        ADD CONSTRAINT appointment_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES "User"(id)
    `;
    await tx`
      ALTER TABLE scheduling.appointment
        ADD CONSTRAINT appointment_psychologist_id_fkey
        FOREIGN KEY (psychologist_id) REFERENCES "User"(id)
    `;
    console.log("✓ Added new FK constraints → public.User");
  });

  console.log("\n✅ Migration complete — scheduling FK now points to public.User");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
