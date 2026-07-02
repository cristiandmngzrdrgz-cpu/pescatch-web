import 'dotenv/config'
import { getDb, initSchema, migrateSchema } from '../src/lib/db'
import { scrapeStore, updateDealInDb } from '../src/lib/price-scraper'

interface DealRow {
  id: string
  productId: string
  title: string
  storeId: string
  storeName: string
  affiliateUrl: string
  salePrice: number
  ean: string
  asin: string
}

async function main() {
  await initSchema()
  await migrateSchema()

  const db = getDb()

  const result = await db.execute(
    `SELECT id, productId, title, storeId, storeName, affiliateUrl, salePrice, ean, asin
     FROM deals
     WHERE hidden = 0 AND affiliateUrl != ''
     ORDER BY storeId, title`
  )

  const deals = result.rows as unknown as DealRow[]
  console.log(`\n📦 ${deals.length} deals to check\n`)

  let updated = 0
  let sanity = 0
  let failed = 0

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i]
    const pct = `${((i + 1) / deals.length * 100).toFixed(0)}%`
    console.log(`[${pct}] ${deal.storeName} → ${deal.title}`)

    const scrapeResult = await scrapeStore(deal.affiliateUrl, deal.storeId, deal.title)

    if (!scrapeResult.success || !scrapeResult.price) {
      console.log(`       ✗ ${scrapeResult.error || 'No result'}`)
      failed++
      continue
    }

    const p = scrapeResult.price
    console.log(`       ✓ €${p.price.toFixed(2)} (Sheet: €${deal.salePrice.toFixed(2)})`)

    if (p.price <= 0) {
      console.log(`       → Skipped (invalid price)`)
      continue
    }

    const status = await updateDealInDb(deal.id, p, deal.salePrice)
    if (status === 'updated') {
      console.log(`       ✅ €${deal.salePrice.toFixed(2)} → €${p.price.toFixed(2)}`)
      updated++
    } else if (status === 'sanity_filtered') {
      console.log(`       → Skipped (price diff >40%, likely wrong variant)`)
      sanity++
    }
  }

  console.log(`\n✅ Done! ${updated} updated, ${sanity} sanity-filtered, ${failed} failed\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
