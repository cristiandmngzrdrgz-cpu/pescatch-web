import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { initSchema, getDb, migrateSchema } from '@/lib/db'
import { amazonAsinConflict } from '@/lib/sync/matcher'

async function makeAmazonDeal(productId: string, asin: string) {
  const db = getDb()
  const id = `deal_test_${Math.random().toString(36).slice(2)}`
  await db.execute({
    sql: `INSERT INTO deals (id, productId, title, slug, salePrice, originalPrice, discountPercent, storeId, asin, affiliateUrl, status)
      VALUES (?, ?, 'Test deal', ?, 20, 20, 0, 'amazon', ?, ?, 'published')`,
    args: [id, productId, `slug-${id}`, asin, `https://www.amazon.es/dp/${asin}?tag=pescatch-21`],
  })
  return id
}

beforeAll(async () => {
  await initSchema()
  await migrateSchema()
})

beforeEach(async () => {
  const db = getDb()
  await db.execute("DELETE FROM deals WHERE id LIKE 'deal_test_%'")
  await db.execute("DELETE FROM products WHERE id LIKE 'prod_test_%'")
})

describe('guard de variantes por ASIN', () => {
  it('no hay conflicto si el producto aún no tiene deal de Amazon', async () => {
    expect(await amazonAsinConflict('prod_test_vacio', 'B01C7N7G1I')).toBe(false)
  })

  it('no hay conflicto con el mismo ASIN', async () => {
    await makeAmazonDeal('prod_test_a', 'B01C7N7G1I')
    expect(await amazonAsinConflict('prod_test_a', 'B01C7N7G1I')).toBe(false)
  })

  it('detecta otra variante del mismo modelo', async () => {
    await makeAmazonDeal('prod_test_b', 'B01C7N7G1I')
    expect(await amazonAsinConflict('prod_test_b', 'B01EFNOEAY')).toBe(true)
  })

  it('detecta el conflicto cuando el ASIN solo está en affiliateUrl', async () => {
    const db = getDb()
    const id = `deal_test_${Math.random().toString(36).slice(2)}`
    await db.execute({
      sql: `INSERT INTO deals (id, productId, title, slug, salePrice, originalPrice, discountPercent, storeId, asin, affiliateUrl, status)
        VALUES (?, 'prod_test_c', 'Test deal', ?, 20, 20, 0, 'amazon', '', 'https://www.amazon.es/dp/B08DJ9GLK9?th=1&psc=1&tag=pescatch-21', 'published')`,
      args: [id, `slug-${id}`],
    })
    expect(await amazonAsinConflict('prod_test_c', 'B08DJ9GLK9')).toBe(false)
    expect(await amazonAsinConflict('prod_test_c', 'B01EFNOEAY')).toBe(true)
  })

  it('sin ASIN en el row no bloquea el match', async () => {
    await makeAmazonDeal('prod_test_d', 'B01C7N7G1I')
    expect(await amazonAsinConflict('prod_test_d', '')).toBe(false)
  })
})
