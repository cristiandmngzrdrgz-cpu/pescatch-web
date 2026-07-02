import { getDb } from '../src/lib/db';

async function prioritize() {
  const db = getDb();

  const deals = await db.execute({
    sql: `SELECT d.id, d.title, d.storeId, d.rating, d.reviewCount, 
      d.discountPercent, d.salePrice, d.originalPrice, d.storeName,
      (SELECT COUNT(*) FROM deals d2 WHERE d2.productId = d.productId) as storeCount,
      length(d.review) as reviewLen,
      length(d.technicalSpecs) as specsLen
    FROM deals d
    WHERE length(d.review) = 0
    GROUP BY d.productId
    ORDER BY 
      (COALESCE(d.rating, 0) * COALESCE(d.reviewCount, 0) * 0.01 +
       d.discountPercent * 0.5 +
       CASE WHEN d.salePrice > 20 THEN d.salePrice * 0.1 ELSE 0 END +
       (SELECT COUNT(*) FROM deals d2 WHERE d2.productId = d.productId) * 3) DESC
    LIMIT 10`,
    args: [],
  });

  console.log('=== TOP 10 productos prioritarios (sin contenido) ===\n');
  deals.rows.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   Tienda: ${r.storeName} (${r.storeId}) | Precio: ${r.salePrice}€ | Dto: -${r.discountPercent}%`);
    console.log(`   Rating: ${r.rating || 'N/A'} (${r.reviewCount || 0} reviews) | Tiendas: ${r.storeCount}`);
    console.log('');
  });
}

prioritize().catch(console.error);
