import { getDb } from '../src/lib/db';

async function check() {
  const db = getDb();
  
  const products = await db.execute({
    sql: `SELECT name, length(description) as descLen, 
      CASE WHEN description != '' THEN '✅' ELSE '❌' END as hasContent
    FROM products 
    WHERE name LIKE '%BUDEFO%' OR name LIKE '%EVA%' 
      OR name LIKE '%Phishger (5-30g)%' OR name LIKE '%UPF 50%'
    ORDER BY name`,
    args: [],
  });

  console.log('=== Productos en DB después del sync ===');
  products.rows.forEach(r => console.log(`${r.hasContent} ${r.name} (${r.descLen} chars)`));
  
  const deals = await db.execute({
    sql: `SELECT d.title, length(d.description) as descLen,
      CASE WHEN d.description != '' THEN '✅' ELSE '❌' END as hasContent
    FROM deals d
    WHERE d.title LIKE '%BUDEFO%' OR d.title LIKE '%EVA%' 
      OR d.title LIKE '%Phishger (5-30g)%' OR d.title LIKE '%UPF 50%'
    ORDER BY d.title`,
    args: [],
  });

  console.log('\n=== Deals en DB después del sync ===');
  deals.rows.forEach(r => console.log(`${r.hasContent} ${r.title} (${r.descLen} chars)`));
}

check().catch(console.error);
