import { getDb } from '../src/lib/db';
(async () => {
  const db = getDb();
  const result = await db.execute(`
    SELECT id, title, storeId, affiliateUrl, asin,
      CASE WHEN imageUrl != '' AND imageUrl IS NOT NULL THEN 1 ELSE 0 END as hasImage,
      imageUrl
    FROM deals WHERE hidden = 0 ORDER BY createdAt DESC LIMIT 15
  `);
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    console.log(
      `${r.hasImage ? '🖼️' : '❌'} ${(r.title as string).slice(0, 50)} | ${r.storeId} | hasImage:${r.hasImage}`
    );
    if (r.imageUrl) console.log(`     ${(r.imageUrl as string).slice(0, 80)}`);
  }
})();
