import 'dotenv/config'
import { refreshAllPrices } from '../src/lib/price-scraper/refresh-all'

async function main() {
  console.log('Refreshing prices...\n')

  const result = await refreshAllPrices()

  console.log(`✅ Done! ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`)
  if (result.alerts > 0) {
    console.log(`⚠ ${result.alerts} deals flagged with priceAlert (large price change)`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
