import { getDb } from '@/lib/db'
import type { InValue } from '@libsql/client'
import { scrapeStore, updateDealInDb } from './index'
import { buildAmazonUrl, extractAsin } from '@/lib/amazon-affiliate'
import { logScrapingHealth } from '@/lib/scraping-health'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '@/lib/email'
import { deleteDeal } from '@/data/queries'
import { getCronState, setCronState } from '@/lib/cron-state'

const REFRESH_CURSOR_KEY = 'refresh_prices_cursor'

// Condiciones compartidas entre la consulta del chunk y el chequeo "¿quedan más?".
const ELIGIBLE_DEALS_WHERE = `status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now')) AND affiliateUrl != ''
     AND storeId != 'decathlon'`

interface DealRow {
  id: string
  title: string
  storeId: string
  affiliateUrl: string
  salePrice: number
  variantAsin: string
}

interface RefreshResult {
  updated: number
  skipped: number
  failed: number
  removed: number
  removedIds: string[]
  alerts: number
}

export interface RefreshOptions {
  // Tamaño de chunk para ejecución por lotes (cron Vercel). Sin limit = ciclo completo.
  limit?: number
  // Fuerza el reinicio del cursor antes de procesar.
  resetCursor?: boolean
}

export async function refreshAllPrices(options: RefreshOptions = {}): Promise<RefreshResult> {
  const db = getDb()
  const { limit, resetCursor } = options

  let afterId = ''
  if (limit) {
    if (resetCursor) {
      await setCronState(REFRESH_CURSOR_KEY, '')
      afterId = ''
    } else {
      afterId = await getCronState(REFRESH_CURSOR_KEY)
    }
  }

  const clauses: InValue[] = []
  let cursorClause = ''
  if (afterId) {
    cursorClause = ' AND id > ?'
    clauses.push(afterId)
  }
  let limitClause = ''
  if (limit) {
    limitClause = ' LIMIT ?'
    clauses.push(limit)
  }

  const result = await db.execute({
    sql: `SELECT id, title, storeId, affiliateUrl, salePrice,
     COALESCE(variantAsin, '') as variantAsin
     FROM deals
     WHERE ${ELIGIBLE_DEALS_WHERE}${cursorClause}
     ORDER BY id${limitClause}`,
    args: clauses,
  })

  const deals = result.rows as unknown as DealRow[]
  let updated = 0
  let skipped = 0
  let failed = 0
  let removed = 0
  const removedIds: string[] = []
  let alerts = 0

  const storeStats = new Map<string, { success: number; fail: number; errors: string[] }>()

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i]

    if (!storeStats.has(deal.storeId)) {
      storeStats.set(deal.storeId, { success: 0, fail: 0, errors: [] })
    }
    const stats = storeStats.get(deal.storeId)!

    let scrapeUrl = deal.affiliateUrl
    if (deal.storeId === 'amazon' && deal.variantAsin) {
      scrapeUrl = buildAmazonUrl(deal.variantAsin)
    } else if (deal.storeId === 'amazon' && !deal.variantAsin) {
      const asin = extractAsin(deal.affiliateUrl)
      if (asin) scrapeUrl = buildAmazonUrl(asin)
    }

    const currentPrice = deal.storeId === 'aliexpress' ? deal.salePrice : undefined
    const scrapeResult = await scrapeStore(scrapeUrl, deal.storeId, deal.title, currentPrice)

    if (!scrapeResult.success || !scrapeResult.price) {
      failed++
      stats.fail++
      if (scrapeResult.error) stats.errors.push(scrapeResult.error)
      continue
    }

    const p = scrapeResult.price
    if (p.notAvailable) {
      removed++
      removedIds.push(deal.id)
      stats.fail++
      await deleteDeal(deal.id)
      console.log(`  🗑️ Eliminado (producto no disponible): ${deal.title}`)
      continue
    }

    if (p.price <= 0) {
      skipped++
      stats.fail++
      continue
    }

    stats.success++

    const status = await updateDealInDb(deal.id, p, deal.salePrice)
    if (status === 'updated') {
      updated++
    } else if (status === 'sanity_filtered') {
      alerts++
      updated++
    } else {
      skipped++
    }
  }

  for (const [storeId, stats] of storeStats.entries()) {
    await logScrapingHealth({
      store_id: storeId,
      operation: 'refresh-prices',
      success_count: stats.success,
      fail_count: stats.fail,
      avg_response_time_ms: 0,
      errors: stats.errors.slice(0, 10),
    })
  }

  if (alerts > 0 && isEmailConfigured()) {
    const alertDeals = await db.execute({
      sql: `SELECT title, salePrice, originalPrice, slug, storeName FROM deals WHERE priceAlert = 1 LIMIT 10`,
    })

    const body = alertDeals.rows.map((d: Record<string, unknown>) => `
      <div class="deal-card">
        <p class="deal-title">${d.title}</p>
        <p style="color: #FF4757;">⚠️ Cambio de precio significativo: ${d.salePrice}€ (antes ${d.originalPrice}€)</p>
        <p style="color: #8BA3C7;">${d.storeName}</p>
        <a href="https://www.pescatch.es/deals/${d.slug}" class="btn" style="margin-top: 8px;">Ver chollo</a>
      </div>
    `).join('')

    await sendAdminNotification(
      `${alerts} alertas de precio`,
      buildAdminNotificationHtml('Alertas de precio', `
        <p>Se detectaron ${alerts} cambios de precio significativos durante el refresco:</p>
        ${body}
      `),
    )

    await db.execute({
      sql: 'UPDATE deals SET priceAlert = 0 WHERE priceAlert = 1',
    })
  }

  if (limit && deals.length > 0) {
    // Persiste el cursor del ciclo chunked. Fin de ciclo = no quedan deals
    // elegibles más allá del último procesado (comprobación explícita: si el
    // chunk encaja exacto con el total, length === limit y aun así termina).
    const lastId = String(deals[deals.length - 1].id)
    const more = await db.execute({
      sql: `SELECT COUNT(*) as n FROM deals WHERE ${ELIGIBLE_DEALS_WHERE} AND id > ?`,
      args: [lastId],
    })
    await setCronState(REFRESH_CURSOR_KEY, Number(more.rows[0].n) > 0 ? lastId : '')
  }

  return { updated, skipped, failed, removed, removedIds, alerts }
}
