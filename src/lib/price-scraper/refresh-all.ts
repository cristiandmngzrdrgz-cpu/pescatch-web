import { getDb } from '@/lib/db'
import type { InValue } from '@libsql/client'
import { scrapeStore, updateDealInDb } from './index'
import { buildAmazonUrl, extractAsin } from '@/lib/amazon-affiliate'
import { logScrapingHealth } from '@/lib/scraping-health'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from '@/lib/email'
import { deleteDeal } from '@/data/queries'
import { getCronState, setCronState } from '@/lib/cron-state'

const REFRESH_CURSOR_KEY = 'refresh_prices_cursor'

// Si Amazon devuelve captcha/bloqueo, todos los scrapes fallan. Sin este
// circuit breaker el refresh sigue machacando la ficha 115 veces (y el
// bloqueo se prolonga). Se aborta el chunk y se avisa al admin.
const MAX_CONSECUTIVE_FAILURES = 10

// Condiciones compartidas entre la consulta del chunk y el chequeo "¿quedan más?".
// AliExpress queda FUERA del refresh automático: su API de afiliados devuelve el
// precio de app (`target_app_sale_price`), no el de la ficha web, y descuentos/MSRP
// falsos. Los precios AE se verifican a mano contra la ficha (BrightData/Playwright)
// y se corrigen en el Sheet; el refresh automático los pisaba con precios más bajos.
const ELIGIBLE_DEALS_WHERE = `status = 'published' AND (expiresAt IS NULL OR expiresAt > datetime('now')) AND affiliateUrl != ''
     AND storeId NOT IN ('decathlon', 'aliexpress')`

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
  // Diagnóstico del ciclo chunked: deals intentados en esta pasada, deals
  // elegibles que quedan después del cursor y si hubo que recuperar un cursor
  // huérfano (p. ej. tras excluir una tienda del refresh).
  processed: number
  remaining: number
  cursorReset: boolean
}

export interface RefreshOptions {
  // Tamaño de chunk para ejecución por lotes (cron Vercel). Sin limit = ciclo completo.
  limit?: number
  // Fuerza el reinicio del cursor antes de procesar.
  resetCursor?: boolean
}

async function selectDeals(
  db: ReturnType<typeof getDb>,
  afterId: string,
  limit?: number,
): Promise<DealRow[]> {
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
  return result.rows as unknown as DealRow[]
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

  let deals = await selectDeals(db, afterId, limit)
  let cursorReset = false

  // Un cursor huérfano (deal borrado/expirado o tienda excluida del filtro
  // después de fijarlo) deja la consulta en 0 para siempre: sin este reset,
  // el refresh chunked se queda muerto. Si no hay nada después del cursor,
  // empezamos un ciclo nuevo desde el principio.
  if (limit && afterId && deals.length === 0) {
    await setCronState(REFRESH_CURSOR_KEY, '')
    afterId = ''
    deals = await selectDeals(db, '', limit)
    cursorReset = true
  }
  let updated = 0
  let skipped = 0
  let failed = 0
  let removed = 0
  const removedIds: string[] = []
  let alerts = 0
  let attempted = 0
  let consecutiveScrapeFailures = 0

  const storeStats = new Map<string, { success: number; fail: number; errors: string[] }>()

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i]
    attempted = i + 1

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
      consecutiveScrapeFailures++
      if (consecutiveScrapeFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log(`  ⛔ ${consecutiveScrapeFailures} fallos consecutivos: se aborta el refresh (posible captcha/bloqueo de Amazon)`)
        break
      }
      continue
    }

    consecutiveScrapeFailures = 0
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
    } else if (status === 'quarantined') {
      alerts++
      skipped++
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

  if (attempted > 0 && failed === attempted && isEmailConfigured()) {
    await sendAdminNotification(
      'Refresh de precios bloqueado',
      buildAdminNotificationHtml('Refresh de precios bloqueado', `
        <p>Los ${attempted} deals intentados fallaron. Amazon está devolviendo captcha o bloqueando el scrape.</p>
        <p>El refresh se detuvo para no insistir. Revisa una ficha manualmente o usa BrightData/PA-API.</p>
      `),
    )
  }

  let remaining = 0
  if (limit) {
    if (attempted > 0) {
      // Persiste el cursor del ciclo chunked. Fin de ciclo = no quedan deals
      // elegibles más allá del último procesado (comprobación explícita: si el
      // chunk encaja exacto con el total, length === limit y aun así termina).
      // Si el circuit breaker abortó, el cursor avanza solo hasta el último
      // deal intentado: el resto se reintenta en la siguiente pasada.
      const lastId = String(deals[attempted - 1].id)
      const more = await db.execute({
        sql: `SELECT COUNT(*) as n FROM deals WHERE ${ELIGIBLE_DEALS_WHERE} AND id > ?`,
        args: [lastId],
      })
      remaining = Number(more.rows[0].n)
      await setCronState(REFRESH_CURSOR_KEY, remaining > 0 ? lastId : '')
    } else {
      // Sin deals en el chunk: si el catálogo tiene elegibles, el workflow
      // debe fallar para que no pasemos por alto otro cursor roto.
      const total = await db.execute({
        sql: `SELECT COUNT(*) as n FROM deals WHERE ${ELIGIBLE_DEALS_WHERE}`,
      })
      remaining = Number(total.rows[0].n)
    }
  }

  return {
    updated,
    skipped,
    failed,
    removed,
    removedIds,
    alerts,
    processed: attempted,
    remaining,
    cursorReset,
  }
}
