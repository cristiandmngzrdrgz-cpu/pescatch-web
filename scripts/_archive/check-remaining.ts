import { getDb } from '../src/lib/db';
(async () => {
  const db = getDb();
  const result = await db.execute(`
    SELECT id, title, storeId, affiliateUrl FROM deals
    WHERE (imageUrl = '' OR imageUrl IS NULL) AND hidden = 0
  `);
  console.log(`${result.rows.length} deals without image:\n`);
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    console.log(`  ${r.storeId} | ${(r.title as string).slice(0, 50)}`);
    console.log(`    ${(r.affiliateUrl as string).slice(0, 90)}`);
  }
})();
