import { getDb, initSchema, migrateSchema } from './db'
import { matchByEan, matchBySlug, insertProduct, updateProduct, upsertDeal, recordPricePoint } from './sync/matcher'
import { readJsonFile } from './sync/reader-json'
import { readGoogleSheets } from './sync/reader-sheets'
import { decathlonAdapter } from './sync/decathlon-adapter'
import { amazonAdapter } from './sync/amazon-adapter'
import { aliexpressAdapter } from './sync/aliexpress-adapter'
import { fishingTackleBaitAdapter } from './sync/fishing-tackle-bait-adapter'
import { totalFishingTackleAdapter } from './sync/total-fishing-tackle-adapter'
import { pureFishingAdapter } from './sync/pure-fishing-adapter'
import type { SyncRow, SyncResult, StoreAdapter } from './sync/types'

export interface SyncRunResult extends SyncResult {
  durationMs: number
  rowsProcessed: number
  hiddenOrphans: number
}

export interface SyncLogEntry {
  id: number
  created_at: string
  duration_ms: number
  rows_processed: number
  created: number
  updated: number
  skipped: number
  hidden_orphans: number
  errors: string[]
}

export interface DbStats {
  products: number
  deals: number
  posts: number
}

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
  const ean = row.ean?.trim() || ''

  try {
    let matched: { id: string; exists: boolean } | null = null
    let isNew = false
    const slug = slugify(row.name)

    if (ean) {
      matched = await matchByEan(ean)
    }

    if (!matched) {
      matched = await matchBySlug(slug)
    }

    if (!matched) {
      const uniqueSlug = await generateUniqueSlug(row.name)
      const productId = ean ? `prod_${ean}` : `prod_${uniqueSlug}`
      isNew = true
      await insertProduct(
        productId,
        row.name, uniqueSlug, ean, row.brand || '',
        row.category || '', row.subcategory || '',
        row.imageUrl || '',
        row.description || '',
        now,
      )
      matched = { id: productId, exists: false }
    } else {
      const uniqueSlug = await generateUniqueSlug(row.name, matched.id)
      await updateProduct(
        matched.id,
        row.name, uniqueSlug, row.brand || '',
        row.category || '', row.subcategory || '',
        row.imageUrl || '',
        row.description || '',
        now,
      )
    }

    const productData = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [matched.id],
    })
    if (productData.rows.length === 0) return
    const product = productData.rows[0] as Record<string, unknown>

    const pSlug = product.slug as string || ''
    const pName = product.name as string || ''
    let storeIndex = 0

    const stores: { storeId: string; adapter: StoreAdapter; manualPrice?: number; manualUrl?: string; manualShipping?: number; manualStock?: string }[] = [
      { storeId: 'amazon', adapter: amazonAdapter, manualPrice: row.amazonPrice, manualUrl: row.amazonUrl, manualShipping: row.amazonShipping, manualStock: row.amazonStock },
      { storeId: 'decathlon', adapter: decathlonAdapter, manualPrice: row.decathlonPrice, manualUrl: row.decathlonUrl, manualShipping: row.decathlonShipping, manualStock: row.decathlonStock },
      { storeId: 'aliexpress', adapter: aliexpressAdapter, manualPrice: row.aliexpressPrice, manualUrl: row.aliexpressUrl, manualShipping: row.aliexpressShipping, manualStock: row.aliexpressStock },
      { storeId: 'fishing-tackle-bait', adapter: fishingTackleBaitAdapter, manualPrice: row.fishingTackleBaitPrice, manualUrl: row.fishingTackleBaitUrl, manualShipping: row.fishingTackleBaitShipping, manualStock: row.fishingTackleBaitStock },
      { storeId: 'total-fishing-tackle', adapter: totalFishingTackleAdapter, manualPrice: row.totalFishingTacklePrice, manualUrl: row.totalFishingTackleUrl, manualShipping: row.totalFishingTackleShipping, manualStock: row.totalFishingTackleStock },
      { storeId: 'pure-fishing', adapter: pureFishingAdapter, manualPrice: row.pureFishingPrice, manualUrl: row.pureFishingUrl, manualShipping: row.pureFishingShipping, manualStock: row.pureFishingStock },
    ]

    for (const store of stores) {
      const apiResult = await store.adapter.lookup(ean)

      const price = apiResult?.price ?? store.manualPrice
      const url = apiResult?.url ?? store.manualUrl
      const shipping = apiResult?.shipping ?? store.manualShipping ?? 0
      const stock = apiResult?.stock ?? store.manualStock ?? 'in_stock'

      if (!price || !url) { storeIndex++; continue }

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

      await recordPricePoint(dealId, price, now.split('T')[0])

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
  } catch (err) {
    result.errors.push(`Error processing "${row.name}" (EAN: ${ean}): ${(err as Error).message}`)
  }
}

export async function cleanupOrphanedDeals(): Promise<number> {
  const db = getDb()
  const result = await db.execute(
    `UPDATE deals SET hidden = 1 WHERE productId != '' AND productId NOT IN (SELECT id FROM products) AND hidden = 0`
  )
  return Number(result.rowsAffected) || 0
}

export async function runSync(): Promise<SyncRunResult> {
  await initSchema()
  await migrateSchema()

  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] }
  const start = Date.now()

  let rows: SyncRow[] = []

  if (process.env.GOOGLE_SHEET_CSV_URL) {
    rows = await readGoogleSheets()
  }

  if (rows.length === 0) {
    const dataFile = process.env.DATA_FILE || 'scripts/sync-data.json'
    rows = readJsonFile(dataFile)
  }

  const rowsProcessed = rows.length

  for (const row of rows) {
    await processRow(row, result)
  }

  const hiddenOrphans = await cleanupOrphanedDeals()

  const durationMs = Date.now() - start

  return {
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors,
    durationMs,
    rowsProcessed,
    hiddenOrphans,
  }
}

export async function insertSyncLog(entry: Omit<SyncLogEntry, 'id' | 'created_at'>): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT INTO sync_log (duration_ms, rows_processed, created, updated, skipped, hidden_orphans, errors) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [entry.duration_ms, entry.rows_processed, entry.created, entry.updated, entry.skipped, entry.hidden_orphans, JSON.stringify(entry.errors)],
  })
}

export async function getSyncLogs(limit = 5): Promise<SyncLogEntry[]> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM sync_log ORDER BY id DESC LIMIT ?',
    args: [limit],
  })
  return result.rows.map(row => ({
    id: row.id as number,
    created_at: row.created_at as string,
    duration_ms: row.duration_ms as number,
    rows_processed: row.rows_processed as number,
    created: row.created as number,
    updated: row.updated as number,
    skipped: row.skipped as number,
    hidden_orphans: row.hidden_orphans as number || 0,
    errors: JSON.parse(row.errors as string) as string[],
  }))
}

export async function getLastSync(): Promise<SyncLogEntry | null> {
  const db = getDb()
  const result = await db.execute('SELECT * FROM sync_log ORDER BY id DESC LIMIT 1')
  if (result.rows.length === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as number,
    created_at: row.created_at as string,
    duration_ms: row.duration_ms as number,
    rows_processed: row.rows_processed as number,
    created: row.created as number,
    updated: row.updated as number,
    skipped: row.skipped as number,
    hidden_orphans: row.hidden_orphans as number || 0,
    errors: JSON.parse(row.errors as string) as string[],
  }
}

export async function getDbStats(): Promise<DbStats> {
  const db = getDb()
  const [products, deals, posts] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM products'),
    db.execute('SELECT COUNT(*) as count FROM deals'),
    db.execute('SELECT COUNT(*) as count FROM posts'),
  ])
  return {
    products: Number(products.rows[0].count),
    deals: Number(deals.rows[0].count),
    posts: Number(posts.rows[0].count),
  }
}
