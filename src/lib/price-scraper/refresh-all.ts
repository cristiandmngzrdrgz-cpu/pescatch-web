import { getDb } from '@/lib/db'
import { scrapeStore, updateDealInDb } from './index'
import { buildAmazonUrl, extractAsin } from '@/lib/amazon-affiliate'
import { logScrapingHealth } from '@/lib/scraping-health'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '@/lib/email'

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
  alerts: number
}

export async function refreshAllPrices(): Promise<RefreshResult> {
  const db = getDb()

  const result = await db.execute(
    `SELECT id, title, storeId, affiliateUrl, salePrice,
     COALESCE(variantAsin, '') as variantAsin
     FROM deals
     WHERE status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now')) AND affiliateUrl != ''
     ORDER BY storeId, title`
  )

  const deals = result.rows as unknown as DealRow[]
  let updated = 0
  let skipped = 0
  let failed = 0
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

    const scrapeResult = await scrapeStore(scrapeUrl, deal.storeId, deal.title)

    if (!scrapeResult.success || !scrapeResult.price) {
      failed++
      stats.fail++
      if (scrapeResult.error) stats.errors.push(scrapeResult.error)
      continue
    }

    const p = scrapeResult.price
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
        <a href="https://pescatch.es/deals/${d.slug}" class="btn" style="margin-top: 8px;">Ver chollo</a>
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

  return { updated, skipped, failed, alerts }
}
