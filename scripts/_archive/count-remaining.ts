import { getDb } from '../src/lib/db';

async function main() {
  const db = getDb();
  const { rows } = await db.execute({ sql: 'SELECT COUNT(*) as c FROM deals WHERE length(review) = 0', args: [] });
  const { rows: t } = await db.execute({ sql: 'SELECT COUNT(*) as c FROM deals', args: [] });
  const total = t[0].c as number
  const sinReview = rows[0].c as number
  console.log(`Total deals: ${total}`);
  console.log(`Con review:   ${total - sinReview}`);
  console.log(`Sin review:   ${sinReview}`);
}

main();
