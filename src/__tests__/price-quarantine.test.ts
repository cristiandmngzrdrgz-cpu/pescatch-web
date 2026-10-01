import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { initSchema, getDb, migrateSchema } from '@/lib/db'
import { updateDealInDb } from '@/lib/price-scraper/index'
import type { ScrapedPrice } from '@/lib/price-scraper/types'

function scraped(price: number): ScrapedPrice {
  return { price, stock: 'in_stock', url: 'https://example.com/dp/TEST' }
}

async function makeDeal(salePrice: number, originalPrice: number) {
  const db = getDb()
  const id = `deal_test_${Math.random().toString(36).slice(2)}`
  await db.execute({
    sql: `INSERT INTO deals (id, title, slug, salePrice, originalPrice, discountPercent, storeId, affiliateUrl, status)
      VALUES (?, ?, ?, ?, ?, 0, 'amazon', 'https://example.com/dp/TEST', 'published')`,
    args: [id, 'Test deal', `slug-${id}`, salePrice, originalPrice],
  })
  return id
}

async function readDeal(id: string) {
  const db = getDb()
  const r = await db.execute({
    sql: 'SELECT salePrice, originalPrice, discountPercent, priceAlert, pendingPrice, pendingPriceCount FROM deals WHERE id = ?',
    args: [id],
  })
  return r.rows[0] as unknown as {
    salePrice: number
    originalPrice: number
    discountPercent: number
    priceAlert: number
    pendingPrice: number | null
    pendingPriceCount: number
  }
}

beforeAll(async () => {
  await initSchema()
  await migrateSchema()
})

beforeEach(async () => {
  const db = getDb()
  await db.execute("DELETE FROM deals WHERE id LIKE 'deal_test_%'")
  await db.execute('DELETE FROM price_history')
})

describe('price quarantine', () => {
  it('aplica cambios pequeños directamente', async () => {
    const id = await makeDeal(100, 120)
    const status = await updateDealInDb(id, scraped(95), 100)
    expect(status).toBe('updated')
    const d = await readDeal(id)
    expect(d.salePrice).toBe(95)
    expect(d.priceAlert).toBe(0)
    expect(d.pendingPrice).toBeNull()
  })

  it('pone en cuarentena una caída brusca sin publicar el precio', async () => {
    const id = await makeDeal(183, 183)
    const status = await updateDealInDb(id, scraped(34), 183)
    expect(status).toBe('quarantined')
    const d = await readDeal(id)
    expect(d.salePrice).toBe(183)
    expect(d.discountPercent).toBe(0)
    expect(d.pendingPrice).toBe(34)
    expect(d.pendingPriceCount).toBe(1)
    expect(d.priceAlert).toBe(1)
  })

  it('aplica el precio en cuarentena cuando el siguiente scrape lo confirma', async () => {
    const id = await makeDeal(183, 183)
    expect(await updateDealInDb(id, scraped(34), 183)).toBe('quarantined')
    const status = await updateDealInDb(id, scraped(34.1), 183)
    expect(status).toBe('sanity_filtered')
    const d = await readDeal(id)
    expect(d.salePrice).toBe(34.1)
    expect(d.pendingPrice).toBeNull()
    expect(d.pendingPriceCount).toBe(0)
  })

  it('descarta el pendiente si el siguiente scrape trae otro precio', async () => {
    const id = await makeDeal(183, 183)
    expect(await updateDealInDb(id, scraped(34), 183)).toBe('quarantined')
    // Vuelve el precio normal: cambio pequeño, se aplica y limpia el pendiente
    const status = await updateDealInDb(id, scraped(183), 183)
    expect(status).toBe('updated')
    const d = await readDeal(id)
    expect(d.salePrice).toBe(183)
    expect(d.pendingPrice).toBeNull()
  })

  it('aplica directo sin baseline (precio actual 0)', async () => {
    const id = await makeDeal(0, 0)
    const status = await updateDealInDb(id, scraped(50), 0)
    expect(status).toBe('updated')
    const d = await readDeal(id)
    expect(d.salePrice).toBe(50)
  })
})
