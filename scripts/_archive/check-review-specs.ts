import { getDb } from '../src/lib/db';

async function check() {
  const db = getDb();
  
  const deals = await db.execute({
    sql: `SELECT d.title, d.storeId,
      length(d.review) as reviewLen,
      d.technicalSpecs,
      length(d.description) as descLen
    FROM deals d
    INNER JOIN products p ON d.productId = p.id
    WHERE p.name LIKE '%BUDEFO%' OR p.name LIKE '%EVA%' 
      OR p.name LIKE '%Phishger (5-30g)%' OR p.name LIKE '%UPF 50%'
    ORDER BY d.title`,
    args: [],
  });

  console.log('=== Deals review + technicalSpecs ===\n');
  deals.rows.forEach(r => {
    const specs = JSON.parse(r.technicalSpecs as string);
    const specKeys = Object.keys(specs).length;
    console.log(`📌 ${r.title} (${r.storeId})`);
    console.log(`   review:       ${(r.reviewLen as number) > 0 ? '✅ ' + r.reviewLen + ' chars' : '❌ empty'}`);
    console.log(`   technicalSpecs: ${specKeys > 0 ? '✅ ' + specKeys + ' fields' : '❌ empty'}`);
    console.log(`   description:   ${(r.descLen as number) > 0 ? '✅ ' + r.descLen + ' chars' : '❌ empty'}`);
    console.log('');
  });
}

check().catch(console.error);
