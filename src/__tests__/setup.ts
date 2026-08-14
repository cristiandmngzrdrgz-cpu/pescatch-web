import { beforeAll, beforeEach } from 'vitest'
import { initSchema } from '@/lib/db'

beforeAll(async () => {
  await initSchema()
})

beforeEach(async () => {
  const { getDb } = await import('@/lib/db')
  const db = getDb()
  // Tablas transitorias/acumulativas: se limpian entre tests para que cada
  // test parta sin estado. deals/products/posts/comments se mantienen como
  // baseline del seed (compartido entre tests del mismo archivo).
  const tables = [
    'rate_limits',
    'subscribers',
    'contact_messages',
    'sync_log',
    'pending_candidates',
    'scraping_health',
    'price_history',
    'price_alerts',
  ]
  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`)
    } catch {
      // la tabla puede no existir aún en algún worker sin initSchema completo
    }
  }
})
