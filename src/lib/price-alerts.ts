import { getDb } from './db'
import { isEmailConfigured, sendEmail, buildPriceAlertHtml } from './email'

const BASE_URL = 'https://www.pescatch.es'

interface ActiveAlertRow {
  id: number
  email: string
  dealId: string
  targetPrice: number
  title: string
  salePrice: number
  originalPrice: number
  slug: string
  storeName: string
}

export async function createPriceAlert(
  email: string,
  dealId: string,
  targetPrice: number,
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb()

  const deal = await db.execute({
    sql: `SELECT salePrice FROM deals WHERE id = ? AND status = 'published'`,
    args: [dealId],
  })
  if (deal.rows.length === 0) {
    return { ok: false, error: 'Chollo no encontrado' }
  }

  const currentPrice = Number(deal.rows[0].salePrice) || 0
  if (currentPrice <= 0) {
    return { ok: false, error: 'Este chollo no tiene precio disponible' }
  }

  const target = targetPrice > 0 ? targetPrice : currentPrice

  await db.execute({
    sql: `INSERT INTO price_alerts (email, dealId, targetPrice, status)
          VALUES (?, ?, ?, 'active')
          ON CONFLICT(email, dealId) DO UPDATE SET
            targetPrice = excluded.targetPrice,
            status = 'active',
            triggered_at = NULL,
            created_at = datetime('now')`,
    args: [email, dealId, target],
  })

  return { ok: true }
}

export async function cancelPriceAlert(email: string, dealId: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE price_alerts SET status = 'cancelled' WHERE email = ? AND dealId = ?`,
    args: [email, dealId],
  })
}

export interface ProcessAlertsResult {
  sent: number
  failed: number
  skipped: number
}

export async function processPriceAlerts(): Promise<ProcessAlertsResult> {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT pa.id, pa.email, pa.dealId, pa.targetPrice,
          d.title, d.salePrice, d.originalPrice, d.slug, d.storeName
          FROM price_alerts pa
          JOIN deals d ON d.id = pa.dealId
          WHERE pa.status = 'active'
            AND d.status = 'published'
            AND d.salePrice > 0
            AND d.salePrice <= pa.targetPrice`,
  })

  const alerts = result.rows as unknown as ActiveAlertRow[]
  if (alerts.length === 0) return { sent: 0, failed: 0, skipped: 0 }

  if (!isEmailConfigured()) {
    console.warn('Resend not configured. Set RESEND_API_KEY in .env to send price alerts.')
    return { sent: 0, failed: 0, skipped: alerts.length }
  }

  let sent = 0
  let failed = 0

  for (const alert of alerts) {
    const unsubscribeUrl = `${BASE_URL}/api/price-alerts/unsubscribe?email=${encodeURIComponent(alert.email)}&dealId=${encodeURIComponent(alert.dealId)}`
    const html = buildPriceAlertHtml(
      {
        title: alert.title,
        salePrice: alert.salePrice,
        originalPrice: alert.originalPrice,
        previousPrice: alert.targetPrice,
        storeName: alert.storeName,
        slug: alert.slug,
      },
      unsubscribeUrl,
    )

    const ok = await sendEmail(alert.email, '🔔 Bajada de precio — PesCatch', html)
    if (ok) {
      sent++
      await db.execute({
        sql: `UPDATE price_alerts SET status = 'triggered', triggered_at = datetime('now') WHERE id = ?`,
        args: [alert.id],
      })
    } else {
      failed++
    }
  }

  return { sent, failed, skipped: 0 }
}
