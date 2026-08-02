import 'dotenv/config'
import { refreshAllPrices } from '../src/lib/price-scraper/refresh-all'
import { migrateSchema } from '../src/lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('Refreshing prices...\n')

  await migrateSchema()
  const result = await refreshAllPrices()

  console.log(`✅ Done! ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed, ${result.removed} removed (producto no disponible)`)
  if (result.alerts > 0) {
    console.log(`⚠ ${result.alerts} deals flagged with priceAlert (large price change)`)
  }

  if (result.removedIds.length > 0) {
    const file = path.resolve(process.cwd(), 'data', 'removed-deals.json')
    const existing = fs.existsSync(file)
      ? (JSON.parse(fs.readFileSync(file, 'utf8')) as string[])
      : []
    const merged = [...new Set([...existing, ...result.removedIds])]
    fs.writeFileSync(file, JSON.stringify(merged, null, 2))
    console.log(`📝 ${merged.length} deals pendientes de eliminar en producción (data/removed-deals.json)`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
