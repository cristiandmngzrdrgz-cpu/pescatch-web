import type { ScrapedPrice, PriceScrapeResult } from './types'
import { RateLimiter } from './rate-limiter'
import { scrapeAmazon } from './amazon'
import { scrapeDecathlon } from './decathlon'
import { scrapeAliExpressApi } from './aliexpress'
import { extractAsin } from '@/lib/amazon-affiliate'
import { withRetry } from '@/lib/scraping-utils'

const amazonLimiter = new RateLimiter(4000)
const decathlonLimiter = new RateLimiter(3000)

// Los metaTitle/metaDescription se generan con el precio del momento del sync.
// Cuando el refresh cambia el precio, un texto que menciona el precio viejo
// queda obsoleto: se limpia y generateMetadata usa el fallback dinámico.
function hasStalePrice(text: unknown, sale: number, original: number): boolean {
  if (typeof text !== 'string' || text.length === 0) return false
  const matches = text.match(/\d+[.,]\d{2}\s*(?:€|\?)/g) || []
  return matches.some((raw) => {
    const value = Number(raw.replace(/[^\d,.-]/g, '').replace(',', '.'))
    return Number.isFinite(value)
      && Math.abs(value - sale) > 0.005
      && Math.abs(value - original) > 0.005
  })
}

export async function scrapeStore(
  url: string,
  storeId: string,
  productTitle?: string,
  currentPrice?: number,
): Promise<PriceScrapeResult> {
  switch (storeId) {
    case 'amazon': {
      const asin = extractAsin(url)
      if (!asin) return { success: false, storeId, error: `No ASIN found in URL: ${url}` }

      const result = await withRetry(
        async () => {
          await amazonLimiter.wait()
          const r = await scrapeAmazon(asin, productTitle, url)
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
      // API de afiliados (sin navegador ni captcha). OJO: devuelve el precio de
      // app (`target_app_sale_price`), que suele ser más bajo que el de la ficha
      // web y trae descuentos/MSRP falsos. Por eso AliExpress está excluido de
      // `refreshAllPrices`; este path solo se usa en verificaciones manuales.
      // Gate estricto: si difiere >5% del precio actual en BD, se descarta.
      const apiResult = await scrapeAliExpressApi(url)
      if (apiResult) {
        const dev = currentPrice
          ? Math.abs(apiResult.price - currentPrice) / currentPrice
          : 0
        if (!currentPrice || dev <= 0.05) {
          return { success: true, storeId, price: apiResult }
        }
        return {
          success: false,
          storeId,
          error: `API price ${apiResult.price}€ differs >5% from current ${currentPrice}€`,
        }
      }

      return { success: false, storeId, error: 'AliExpress API returned no result' }
    }

    default:
      return { success: false, storeId, error: `Unsupported store: ${storeId}` }
  }
}

const PRICE_SANITY_THRESHOLD = 0.4
// Un precio pendiente se confirma si el siguiente scrape lo repite (±5%).
// Evita publicar errores de variante (ej. Stradic 183€ → 34€) hasta confirmar.
const PENDING_CONFIRM_TOLERANCE = 0.05

export async function updateDealInDb(
  dealId: string,
  scrapedPrice: ScrapedPrice,
  currentPrice: number,
): Promise<'updated' | 'kept' | 'sanity_filtered' | 'quarantined'> {
  const { getDb } = await import('@/lib/db')
  const db = getDb()
  const now = new Date().toISOString()

  const newPrice = scrapedPrice.price

  const existing = await db.execute({
    sql: 'SELECT originalPrice, pendingPrice, pendingPriceCount, storeId, metaTitle, metaDescription FROM deals WHERE id = ?',
    args: [dealId],
  })
  const currentOriginalPrice = existing.rows.length > 0
    ? Number(existing.rows[0].originalPrice)
    : 0
  const storeId = existing.rows.length > 0 ? String(existing.rows[0].storeId ?? '') : ''
  const pendingPrice = existing.rows.length > 0 && existing.rows[0].pendingPrice != null
    ? Number(existing.rows[0].pendingPrice)
    : null
  const pendingCount = existing.rows.length > 0
    ? Number(existing.rows[0].pendingPriceCount ?? 0)
    : 0
  const currentMetaTitle = existing.rows.length > 0 ? existing.rows[0].metaTitle : null
  const currentMetaDescription = existing.rows.length > 0 ? existing.rows[0].metaDescription : null

  // Sin baseline no hay nada contra lo que validar: se aplica directo.
  const diff = currentPrice > 0 ? Math.abs(newPrice - currentPrice) / currentPrice : 0
  const hasBigChange = currentPrice > 0 && diff > PRICE_SANITY_THRESHOLD

  if (hasBigChange) {
    const confirmed = pendingPrice != null
      && Math.abs(newPrice - pendingPrice) / (pendingPrice || 1) <= PENDING_CONFIRM_TOLERANCE
    if (!confirmed) {
      await db.execute({
        sql: `UPDATE deals SET pendingPrice = ?, pendingPriceCount = ?, priceAlert = ?, updatedAt = ? WHERE id = ?`,
        args: [newPrice, pendingCount + 1, 1, now, dealId],
      })
      return 'quarantined'
    }
  }

  // Amazon: mandan el precio y el tachado reales de la ficha. Si la ficha no
  // muestra descuento, el original pasa a ser el precio actual (0%). No se
  // conserva un original viejo: era la causa de descuentos falsos (55€ sobre
  // una ficha de 34,69€, etc.).
  // AliExpress: sin original verificado, no fabricar descuento; la regla del
  // proyecto es 0% si la ficha no trae tachado real.
  const scrapedOriginal = scrapedPrice.originalPrice && scrapedPrice.originalPrice > newPrice
    ? scrapedPrice.originalPrice
    : 0

  const originalPrice = storeId === 'aliexpress'
    ? currentOriginalPrice > 0
      ? Math.max(currentOriginalPrice, newPrice)
      : newPrice
    : scrapedOriginal > 0
      ? Math.max(scrapedOriginal, newPrice)
      : newPrice

  const discountPercent = Math.round(((originalPrice - newPrice) / (originalPrice || 1)) * 100)
  const metaTitle = hasStalePrice(currentMetaTitle, newPrice, originalPrice) ? '' : currentMetaTitle
  const metaDescription = hasStalePrice(currentMetaDescription, newPrice, originalPrice) ? '' : currentMetaDescription

  await db.execute({
    sql: `UPDATE deals SET
      salePrice = ?, originalPrice = ?, discountPercent = ?,
      shippingCost = ?, stockStatus = ?, updatedAt = ?,
      priceAlert = ?, pendingPrice = NULL, pendingPriceCount = 0,
      metaTitle = ?, metaDescription = ?
    WHERE id = ?`,
    args: [
      newPrice,
      originalPrice,
      discountPercent,
      scrapedPrice.shipping ?? 0,
      scrapedPrice.stock,
      now,
      hasBigChange ? 1 : 0,
      metaTitle,
      metaDescription,
      dealId,
    ],
  })

  await db.execute({
    sql: 'INSERT INTO price_history (dealId, date, price) VALUES (?, ?, ?)',
    args: [dealId, now.split('T')[0], newPrice],
  })

  return hasBigChange ? 'sanity_filtered' : 'updated'
}
