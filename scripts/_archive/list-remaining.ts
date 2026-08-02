import { getDb } from '../src/lib/db';

async function main() {
  const db = getDb();
  const { rows } = await db.execute({
    sql: `SELECT d.title, d.storeId FROM deals d WHERE length(d.review) = 0 ORDER BY d.title`,
    args: [],
  });
  
  console.log('Productos restantes:\n');
  rows.forEach((r, i) => console.log(`${i + 1}. ${r.title} (${r.storeId})`));
  console.log(`\nTotal: ${rows.length}`);
}

main();
