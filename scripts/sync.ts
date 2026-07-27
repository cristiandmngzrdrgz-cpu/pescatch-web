import 'dotenv/config'
import { runSync, insertSyncLog } from '../src/lib/run-sync'

async function main() {
  console.log('Syncing products from data source...\n')

  const result = await runSync()

  console.log(`Sync complete in ${result.durationMs}ms:`)
  console.log(`  ${result.rowsProcessed} products processed`)
  console.log(`  ${result.created} created`)
  console.log(`  ${result.updated} updated`)
  console.log(`  ${result.skipped} skipped`)
  if (result.hiddenOrphans > 0) {
    console.log(`  ${result.hiddenOrphans} deals hidden (orphaned)`)
  }

  if (result.errors.length > 0) {
    console.log(`\n${result.errors.length} errors:`)
    for (const err of result.errors) {
      console.log(`  ✗ ${err}`)
    }
  }

  await insertSyncLog({
    duration_ms: result.durationMs,
    rows_processed: result.rowsProcessed,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    hidden_orphans: result.hiddenOrphans,
    errors: result.errors,
  })

  // Auto-refresh prices after sync
  if (result.created > 0 || result.updated > 0) {
    console.log('\nRefreshing prices...')
    try {
      const { refreshAllPrices } = await import('../src/lib/price-scraper/refresh-all')
      const refreshed = await refreshAllPrices()
      console.log(`  ${refreshed.updated} updated, ${refreshed.skipped} skipped, ${refreshed.failed} failed`)
      if (refreshed.alerts > 0) {
        console.log(`  ⚠ ${refreshed.alerts} deals flagged with priceAlert`)
      }
    } catch (err) {
      console.error(`  ✗ Price refresh error: ${(err as Error).message}`)
    }
  }

  console.log('')
}

main().catch(console.error)
