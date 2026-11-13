// Read-only check on the explicitly configured testing database.
const postgres = require("postgres");
(async () => {
  const url = new URL(process.env.POSTGRES_URL);
  if (url.pathname !== "/oyunsanaa_testing") throw Error("Testing database required.");
  const db = postgres(url.toString(), { ssl: false, max: 1, connect_timeout: 10 });
  try {
    const rows = await db`
      SELECT item.kind, count(*)::int AS count
      FROM "ContentCatalogItem" item
      JOIN "Program" program ON program."catalogItemId" = item.id
      LEFT JOIN LATERAL (
        SELECT COALESCE(NULLIF(version.definition->>'coverImageUrl', ''), NULLIF(version.definition->>'imageUrl', '')) AS image
        FROM "ProgramVersion" version
        WHERE version."programId" = program.id AND version.status = 'PUBLISHED'
        ORDER BY version.version DESC LIMIT 1
      ) cover ON true
      WHERE item.status = 'ACTIVE' AND program.status = 'PUBLISHED' AND program.audience = 'INDIVIDUAL'
      GROUP BY item.kind
    `;
    await db`SELECT count(*)::int FROM "ContentUsage"`;
    console.log("Existing platform library and cover query verified:", rows.reduce((sum, row) => sum + row.count, 0), "published items.");
  } finally { await db.end(); }
})().catch(error => { console.error("Content library read check failed:", error.code || error.message); process.exitCode = 1; });
