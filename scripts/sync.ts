import { getDb, initSchema, migrateSchema } from '../src/lib/db'
import { matchByEan, matchBySlug, insertProduct, updateProduct, upsertDeal, recordPricePoint } from '../src/lib/sync/matcher'
import { readJsonFile } from '../src/lib/sync/reader-json'
import { readGoogleSheets } from '../src/lib/sync/reader-sheets'
import { decathlonAdapter } from '../src/lib/sync/decathlon-adapter'
import { amazonAdapter } from '../src/lib/sync/amazon-adapter'
import { aliexpressAdapter } from '../src/lib/sync/aliexpress-adapter'
import type { SyncRow, SyncResult, StoreAdapter } from '../src/lib/sync/types'

const STORE_ADAPTERS: StoreAdapter[] = [
  amazonAdapter,
  decathlonAdapter,
  aliexpressAdapter,
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product'
}

async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base)
  let counter = 1
  let match = await matchBySlug(slug)
  while (match && match.id !== excludeId) {
    slug = `${slugify(base)}-${counter}`
    counter++
    match = await matchBySlug(slug)
  }
  return slug
}

async function processRow(
  row: SyncRow,
  result: SyncResult,
): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()
  const ean = row.ean?.trim()
  if (!ean) return

  try {
    // 1. Match or create product
    let matched = await matchByEan(ean)
    let isNew = false

    if (!matched) {
      isNew = true
      const slug = await generateUniqueSlug(row.name)
      const productId = `prod_${ean}`
      await insertProduct(
        productId,
        row.name, slug, ean, row.brand || '',
        row.category || '', row.subcategory || '',
        row.imageUrl || '',
        row.description || '',
        now,
      )
      matched = { id: productId, exists: false }
    } else {
      const slug = await generateUniqueSlug(row.name, matched.id)
      await updateProduct(
        matched.id,
        row.name, slug, row.brand || '',
        row.category || '', row.subcategory || '',
        row.imageUrl || '',
        row.description || '',
        now,
      )
    }

    // Get the current product data for copying to deals
    const productData = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [matched.id],
    })
    if (productData.rows.length === 0) return
    const product = productData.rows[0] as Record<string, unknown>

    // 2. Process each store
    const pSlug = product.slug as string || ''
    const pName = product.name as string || ''
    let storeIndex = 0

    const stores: { storeId: string; adapter: StoreAdapter; manualPrice?: number; manualUrl?: string; manualShipping?: number; manualStock?: string }[] = [
      { storeId: 'amazon', adapter: amazonAdapter, manualPrice: row.amazonPrice, manualUrl: row.amazonUrl, manualShipping: row.amazonShipping, manualStock: row.amazonStock },
      { storeId: 'decathlon', adapter: decathlonAdapter, manualPrice: row.decathlonPrice, manualUrl: row.decathlonUrl, manualShipping: row.decathlonShipping, manualStock: row.decathlonStock },
      { storeId: 'aliexpress', adapter: aliexpressAdapter, manualPrice: row.aliexpressPrice, manualUrl: row.aliexpressUrl, manualShipping: row.aliexpressShipping, manualStock: row.aliexpressStock },
    ]

    for (const store of stores) {
      // Try API lookup
      const apiResult = await store.adapter.lookup(ean)

      // Use API result, fallback to manual data
      const price = apiResult?.price ?? store.manualPrice
      const url = apiResult?.url ?? store.manualUrl
      const shipping = apiResult?.shipping ?? store.manualShipping ?? 0
      const stock = apiResult?.stock ?? store.manualStock ?? 'in_stock'

      if (!price || !url) { storeIndex++; continue }

      // First store uses product slug, subsequent stores append storeId for uniqueness
      const dealSlug = storeIndex === 0 ? pSlug : `${pSlug}_${store.storeId}`
      storeIndex++

      const originalPrice = Math.round(price * 1.3 * 100) / 100

      const dealId = await upsertDeal(
        matched.id,
        store.storeId,
        store.adapter.name,
        dealSlug,
        pName,
        originalPrice,
        price,
        shipping,
        stock,
        url,
        now,
      )

      // Record price point
      await recordPricePoint(dealId, price, now.split('T')[0])

      // Copy additional product-level fields to deal
      const pCategory = product.category as string || ''
      const pSubcategory = product.subcategory as string || ''
      const pDescription = product.description as string || ''
      const pImageUrl = product.imageUrl as string || ''
      const pImages = product.images as string || '[]'

      await db.execute({
        sql: `UPDATE deals SET
          category = ?, subcategory = ?,
          description = ?, imageUrl = ?, images = ?, ean = ?
        WHERE id = ?`,
        args: [pCategory, pSubcategory, pDescription, pImageUrl, pImages, ean, dealId],
      })
    }

    if (isNew) result.created++
    else result.updated++

    console.log(`  ${isNew ? 'Created' : 'Updated'} product: ${row.name}`)
  } catch (err) {
    result.errors.push(`Error processing "${row.name}" (EAN: ${ean}): ${(err as Error).message}`)
  }
}

async function main() {
  console.log('Syncing products from data source...\n')

  const db = getDb()
  await initSchema()
  await migrateSchema()

  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }

  // Read data from Google Sheets or local JSON file
  let rows: SyncRow[] = []

  if (process.env.GOOGLE_SHEET_ID) {
    console.log('Reading from Google Sheets...')
    rows = await readGoogleSheets()
  }

  if (rows.length === 0) {
    const dataFile = process.env.DATA_FILE || 'scripts/sync-data.json'
    console.log(`Reading from file: ${dataFile}`)
    rows = readJsonFile(dataFile)
  }

  if (rows.length === 0) {
    console.log('No data found. Create a data file or configure Google Sheets.')
    console.log('Sample: copy scripts/sync-data.json to populate initial data.\n')
    return
  }

  console.log(`Processing ${rows.length} products...\n`)

  for (const row of rows) {
    await processRow(row, result)
  }

  // Summary
  console.log('\nSync complete:')
  console.log(`  ${result.created} products created`)
  console.log(`  ${result.updated} products updated`)
  console.log(`  ${result.skipped} skipped`)

  if (result.errors.length > 0) {
    console.log(`\n${result.errors.length} errors:`)
    for (const err of result.errors) {
      console.log(`  ✗ ${err}`)
    }
  }

  console.log('')
}

main().catch(console.error)
