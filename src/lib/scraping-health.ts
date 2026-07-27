import { getDb } from './db'
import { sendAdminNotification, isEmailConfigured, buildAdminNotificationHtml } from './email'

export interface ScrapingHealthEntry {
  store_id: string
  operation: string
  success_count: number
  fail_count: number
  avg_response_time_ms: number
  errors: string[]
}

export async function logScrapingHealth(entry: ScrapingHealthEntry): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT INTO scraping_health (store_id, operation, success_count, fail_count, avg_response_time_ms, errors)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      entry.store_id,
      entry.operation,
      entry.success_count,
      entry.fail_count,
      entry.avg_response_time_ms,
      JSON.stringify(entry.errors),
    ],
  })

  const total = entry.success_count + entry.fail_count
  if (total > 0 && entry.fail_count / total > 0.5 && isEmailConfigured()) {
    const errorList = entry.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')
    await sendAdminNotification(
      `⚠️ Alto fallo en scraping: ${entry.store_id}`,
      buildAdminNotificationHtml('Alerta de scraping', `
        <p><strong>Tienda:</strong> ${entry.store_id}</p>
        <p><strong>Operación:</strong> ${entry.operation}</p>
        <p><strong>Tasa de fallo:</strong> ${Math.round((entry.fail_count / total) * 100)}%</p>
        <p><strong>Éxitos:</strong> ${entry.success_count} | <strong>Fallos:</strong> ${entry.fail_count}</p>
        ${entry.errors.length > 0 ? `
          <p><strong>Errores recientes:</strong></p>
          <ul>${errorList}</ul>
        ` : ''}
      `),
    )
  }
}

export interface HealthStats {
  store_id: string
  last_run: string
  success_rate: number
  total_success: number
  total_fail: number
  avg_response_time: number
  recent_errors: string[]
}

export async function getScrapingHealthStats(days = 7): Promise<HealthStats[]> {
  const db = getDb()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const result = await db.execute({
    sql: `SELECT
            store_id,
            MAX(timestamp) as last_run,
            SUM(success_count) as total_success,
            SUM(fail_count) as total_fail,
            AVG(avg_response_time_ms) as avg_response_time
          FROM scraping_health
          WHERE timestamp >= ?
          GROUP BY store_id
          ORDER BY store_id`,
    args: [since],
  })

  const stats: HealthStats[] = []

  for (const row of result.rows) {
    const storeId = row.store_id as string
    const totalSuccess = Number(row.total_success) || 0
    const totalFail = Number(row.total_fail) || 0
    const total = totalSuccess + totalFail

    const errorResult = await db.execute({
      sql: `SELECT errors FROM scraping_health
            WHERE store_id = ? AND timestamp >= ? AND errors != '[]'
            ORDER BY timestamp DESC LIMIT 5`,
      args: [storeId, since],
    })

    const recentErrors: string[] = []
    for (const errRow of errorResult.rows) {
      try {
        const errors = JSON.parse(errRow.errors as string) as string[]
        recentErrors.push(...errors)
      } catch {}
    }

    stats.push({
      store_id: storeId,
      last_run: row.last_run as string,
      success_rate: total > 0 ? Math.round((totalSuccess / total) * 100) : 0,
      total_success: totalSuccess,
      total_fail: totalFail,
      avg_response_time: Math.round(Number(row.avg_response_time) || 0),
      recent_errors: recentErrors.slice(0, 10),
    })
  }

  return stats
}
