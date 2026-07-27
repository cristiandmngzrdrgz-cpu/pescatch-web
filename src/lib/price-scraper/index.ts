import type { ScrapedPrice, PriceScrapeResult } from './types'
import { RateLimiter } from './rate-limiter'
import { scrapeAmazon } from './amazon'
import { scrapeDecathlon } from './decathlon'
import { scrapeAliExpress } from './aliexpress'
import { extractAsin } from '@/lib/amazon-affiliate'
import { withRetry } from '@/lib/scraping-utils'

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

      const result = await withRetry(
        async () => {
          await amazonLimiter.wait()
          const r = await scrapeAmazon(asin, productTitle)
          if (!r) throw new Error('Amazon scrape returned no result')
          return r
        },
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          onRetry: (attempt, delay, error) => {
            console.log(`  🔄 Amazon retry ${attempt}/3 (${delay}ms): ${error.message}`)
          },
        }
      )

      if (!result.success) {
        return { success: false, storeId, error: result.error?.message ?? 'Unknown error' }
      }
      return { success: true, storeId, price: result.data }
    }

    case 'decathlon': {
      const result = await withRetry(
        async () => {
          await decathlonLimiter.wait()
          const r = await scrapeDecathlon(url)
          if (!r) throw new Error('Decathlon scrape returned no result')
          return r
        },
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          onRetry: (attempt, delay, error) => {
            console.log(`  🔄 Decathlon retry ${attempt}/3 (${delay}ms): ${error.message}`)
          },
        }
      )

      if (!result.success) {
        return { success: false, storeId, error: result.error?.message ?? 'Unknown error' }
      }
      return { success: true, storeId, price: result.data }
    }

    case 'aliexpress': {
      const result = await withRetry(
        async () => {
          await aliexpressLimiter.wait()
          const r = await scrapeAliExpress(url)
          if (!r) throw new Error('AliExpress scrape returned no result')
          return r
        },
        {
          maxRetries: 3,
          initialDelayMs: 3000,
          onRetry: (attempt, delay, error) => {
            console.log(`  🔄 AliExpress retry ${attempt}/3 (${delay}ms): ${error.message}`)
          },
        }
      )

      if (!result.success) {
        return { success: false, storeId, error: result.error?.message ?? 'Unknown error' }
      }
      return { success: true, storeId, price: result.data }
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

  const existing = await db.execute({
    sql: 'SELECT originalPrice FROM deals WHERE id = ?',
    args: [dealId],
  })
  const currentOriginalPrice = existing.rows.length > 0
    ? Number(existing.rows[0].originalPrice)
    : 0

  const diff = Math.abs(newPrice - currentPrice) / (currentPrice || 1)
  const hasBigChange = diff > PRICE_SANITY_THRESHOLD

  const originalPrice = currentOriginalPrice > 0
    ? currentOriginalPrice
    : Math.round(newPrice * 1.3 * 100) / 100
  const discountPercent = Math.round(((originalPrice - newPrice) / (originalPrice || 1)) * 100)

  await db.execute({
    sql: `UPDATE deals SET
      salePrice = ?, originalPrice = ?, discountPercent = ?,
      shippingCost = ?, stockStatus = ?, updatedAt = ?,
      priceAlert = ?
    WHERE id = ?`,
    args: [
      newPrice,
      originalPrice,
      discountPercent,
      scrapedPrice.shipping ?? 0,
      scrapedPrice.stock,
      now,
      hasBigChange ? 1 : 0,
      dealId,
    ],
  })

  await db.execute({
    sql: 'INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
    args: [dealId, now.split('T')[0], newPrice],
  })

  return hasBigChange ? 'sanity_filtered' : 'updated'
}
