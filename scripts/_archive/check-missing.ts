import { getDb } from '../src/lib/db';

async function check() {
  const db = getDb();

  const deals = await db.execute({
    sql: `SELECT d.id, d.title, d.storeId,
      length(d.review) as reviewLen,
      length(d.technicalSpecs) as specsLen,
      length(d.description) as descLen
    FROM deals d
    ORDER BY d.title`,
    args: [],
  });

  let withReview = 0, withSpecs = 0, total = 0;
  console.log('=== Productos sin review ===\n');
  deals.rows.forEach(r => {
    total++;
    if ((r.reviewLen as number) > 0) withReview++;
    if ((r.specsLen as number) > 2) withSpecs++;
    if ((r.reviewLen as number) === 0) {
      console.log(`❌ ${r.title} (${r.storeId})`);
    }
  });
  console.log(`\n=== Resumen ===`);
  console.log(`Total deals: ${total}`);
  console.log(`Con review: ${withReview}`);
  console.log(`Con technicalSpecs: ${withSpecs}`);
  console.log(`Sin review: ${total - withReview}`);
}

check().catch(console.error);
