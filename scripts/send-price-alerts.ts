import 'dotenv/config'
import { getDb } from '../src/lib/db'
import { seedDatabase } from '../src/lib/seed'
import { processPriceAlerts } from '../src/lib/price-alerts'

async function main() {
  await seedDatabase()
  const db = getDb()

  const active = await db.execute({
    sql: `SELECT COUNT(*) as count FROM price_alerts WHERE status = 'active'`,
  })
  console.log(`🔔 Alertas activas: ${active.rows[0]?.count ?? 0}`)

  const result = await processPriceAlerts()
  console.log(`✅ Enviadas: ${result.sent} | Fallos: ${result.failed} | Saltadas: ${result.skipped}`)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})