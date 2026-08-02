import { getDb } from '../src/lib/db';
(async () => {
  const db = getDb();
  const r1 = await db.execute("SELECT COUNT(*) as c FROM deals WHERE imageUrl = '' OR imageUrl IS NULL");
  const r2 = await db.execute("SELECT COUNT(*) as c FROM deals WHERE description = '' OR description IS NULL");
  const r3 = await db.execute("SELECT COUNT(*) as c FROM deals WHERE review = '' OR review IS NULL");
  const r4 = await db.execute("SELECT COUNT(*) as c FROM deals WHERE technicalSpecs = '{}' OR technicalSpecs IS NULL");
  const r5 = await db.execute("SELECT COUNT(*) as c FROM deals");
  console.log('Total deals:', r5.rows[0].c);
  console.log('Without imageUrl:', r1.rows[0].c);
  console.log('Without description:', r2.rows[0].c);
  console.log('Without review:', r3.rows[0].c);
  console.log('Without specs:', r4.rows[0].c);
})();
