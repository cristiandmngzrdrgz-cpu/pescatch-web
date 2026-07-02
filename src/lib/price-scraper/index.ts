import type { ScrapedPrice, PriceScrapeResult } from './types'
import { RateLimiter } from './rate-limiter'
import { scrapeAmazon, extractAsin } from './amazon'
import { scrapeDecathlon } from './decathlon'
import { scrapeAliExpress } from './aliexpress'

const amazonLimiter = new RateLimiter(4000)
const decathlonLimiter = new RateLimiter(3000)
const aliexpressLimiter = new RateLimiter(5000)

export async function scrapeStore(
  url: string,
  storeId: string,
  productTitle?: string,
): Promise<PriceScrapeResult> {
  switch (storeId) {
    case 'amazon': {
      const asin = extractAsin(url)
      if (!asin) return { success: false, storeId, error: `No ASIN found in URL: ${url}` }

      await amazonLimiter.wait()
      const result = await scrapeAmazon(asin, productTitle)
      if (!result) return { success: false, storeId, error: 'Amazon scrape returned no result' }

      return { success: true, storeId, price: result }
    }

    case 'decathlon': {
      await decathlonLimiter.wait()
      const result = await scrapeDecathlon(url)
      if (!result) return { success: false, storeId, error: 'Decathlon scrape returned no result' }

      return { success: true, storeId, price: result }
    }

    case 'aliexpress': {
      await aliexpressLimiter.wait()
      const result = await scrapeAliExpress(url)
      if (!result) return { success: false, storeId, error: 'AliExpress scrape returned no result' }

      return { success: true, storeId, price: result }
    }

    default:
      return { success: false, storeId, error: `Unsupported store: ${storeId}` }
  }
}

const PRICE_SANITY_THRESHOLD = 0.4

export async function updateDealInDb(
  dealId: string,
  scrapedPrice: ScrapedPrice,
  currentPrice: number,
): Promise<'updated' | 'kept' | 'sanity_filtered'> {
  const { getDb } = await import('@/lib/db')
  const db = getDb()
  const now = new Date().toISOString()

  const newPrice = scrapedPrice.price

  const diff = Math.abs(newPrice - currentPrice) / (currentPrice || 1)
  if (diff > PRICE_SANITY_THRESHOLD) {
    return 'sanity_filtered'
  }

  const originalPrice = Math.round(newPrice * 1.3 * 100) / 100
  const discountPercent = Math.round(((originalPrice - newPrice) / (originalPrice || 1)) * 100)

  await db.execute({
    sql: `UPDATE deals SET
      salePrice = ?, originalPrice = ?, discountPercent = ?,
      shippingCost = ?, stockStatus = ?, updatedAt = ?
    WHERE id = ?`,
    args: [
      newPrice,
      originalPrice,
      discountPercent,
      scrapedPrice.shipping ?? 0,
      scrapedPrice.stock,
      now,
      dealId,
    ],
  })

  await db.execute({
    sql: 'INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
    args: [dealId, now.split('T')[0], newPrice],
  })

  return 'updated'
}
