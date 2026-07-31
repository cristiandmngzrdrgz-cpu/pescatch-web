import { getDb, initSchema, migrateSchema } from './db'
import { matchByEan, matchBySlug, insertProduct, updateProduct, upsertDeal, recordPricePoint } from './sync/matcher'
import { readJsonFile } from './sync/reader-json'
import { readGoogleSheets } from './sync/reader-sheets'
import { decathlonAdapter } from './sync/decathlon-adapter'
import { amazonAdapter } from './sync/amazon-adapter'
import { aliexpressAdapter } from './sync/aliexpress-adapter'
import { buildAmazonUrl } from './amazon-affiliate'
import { enrichDealInDb, generateEnrichment, extractAsin } from './enrich-deal'

import { validateSyncRow } from './sync/validation'
import { enrichWithAI } from './enrich-ai'
import { findFuzzyMatch } from './sync/fuzzy-matcher'
import { normalizeCategory, normalizeSubcategory } from './normalize-category'
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
  const category = normalizeCategory(row.category)
  const subcategory = normalizeSubcategory(category, row.subcategory)

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

    if (!matched && category) {
      const fuzzyMatch = await findFuzzyMatch(row.name, row.brand || '', category)
      if (fuzzyMatch.matchType === 'exact') {
        matched = { id: fuzzyMatch.productId, exists: true }
        console.log(`  🔗 Fuzzy match (${Math.round(fuzzyMatch.confidence * 100)}%): "${row.name}" → existing product`)
      } else if (fuzzyMatch.matchType === 'fuzzy') {
        console.log(`  ⚠️ Possible duplicate (${Math.round(fuzzyMatch.confidence * 100)}%): "${row.name}" - creating new product`)
      }
    }

    if (!matched) {
      const uniqueSlug = await generateUniqueSlug(row.name)
      const productId = ean ? `prod_${ean}` : `prod_${uniqueSlug}`
      isNew = true
      await insertProduct(
        productId,
        row.name, uniqueSlug, ean, row.brand || '',
        category, subcategory,
        row.imageUrl || '',
        row.description || '',
        now,
      )
      matched = { id: productId, exists: false }
    } else {
      const existing = await db.execute({
        sql: 'SELECT slug, name FROM products WHERE id = ?',
        args: [matched.id],
      })
      const existingSlug = existing.rows.length > 0 ? (existing.rows[0].slug as string) : ''
      const existingName = existing.rows.length > 0 ? (existing.rows[0].name as string) : ''
      const uniqueSlug = (existingName === row.name && existingSlug)
        ? existingSlug
        : await generateUniqueSlug(row.name, matched.id)
      await updateProduct(
        matched.id,
        row.name, uniqueSlug, row.brand || '',
        category, subcategory,
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

    const stores: { storeId: string; adapter: StoreAdapter; manualPrice?: number; manualUrl?: string; manualShipping?: number; manualStock?: string; manualOriginalPrice?: number }[] = [
      { storeId: 'amazon', adapter: amazonAdapter, manualPrice: row.amazonPrice, manualUrl: row.amazonUrl, manualShipping: row.amazonShipping, manualStock: row.amazonStock, manualOriginalPrice: row.amazonOriginalPrice },
      { storeId: 'decathlon', adapter: decathlonAdapter, manualPrice: row.decathlonPrice, manualUrl: row.decathlonUrl, manualShipping: row.decathlonShipping, manualStock: row.decathlonStock, manualOriginalPrice: row.decathlonOriginalPrice },
      { storeId: 'aliexpress', adapter: aliexpressAdapter, manualPrice: row.aliexpressPrice, manualUrl: row.aliexpressUrl, manualShipping: row.aliexpressShipping, manualStock: row.aliexpressStock, manualOriginalPrice: row.aliexpressOriginalPrice },
    ]

    for (const store of stores) {
      const apiResult = await store.adapter.lookup(ean)

      const price = apiResult?.price ?? store.manualPrice
      let url = apiResult?.url ?? store.manualUrl
      if (store.storeId === 'amazon' && row.amazonVariantAsin && url) {
        url = buildAmazonUrl(url, row.amazonVariantAsin)
      }
      const shipping = apiResult?.shipping ?? store.manualShipping ?? 0
      const stock = apiResult?.stock ?? store.manualStock ?? 'in_stock'

      if (!price || !url) { storeIndex++; continue }

      const dealSlug = storeIndex === 0 ? pSlug : `${pSlug}_${store.storeId}`
      storeIndex++

      const originalPrice = store.manualOriginalPrice ?? price

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

      // Apply enrichment from sheet columns (technicalSpecs, review, pros, cons)
      if (row.technicalSpecs || row.review || row.pros || row.cons) {
        try {
          await enrichDealInDb(dealId, {
            technicalSpecs: row.technicalSpecs || '',
            review: row.review || '',
            pros: row.pros || '',
            cons: row.cons || '',
          })
        } catch {}
      }
    }

    // Auto-enrich new Amazon deals that have no specs yet
    if (isNew) {
      result.created++
      const amazonUrl = stores.find(s => s.storeId === 'amazon')?.manualUrl || ''
      const asin = amazonUrl ? extractAsin(amazonUrl) : null
      if (asin) {
        try {
          const { scrapeAmazonDetails } = await import('../../scripts/discover/amazon')
          const details = await scrapeAmazonDetails(asin)
          if (details.features.length > 0 || details.description) {
            const existingDeal = await db.execute({
              sql: 'SELECT id FROM deals WHERE productId = ? AND storeId = ?',
              args: [matched.id, 'amazon'],
            })
            if (existingDeal.rows.length > 0) {
              const dealId = existingDeal.rows[0].id as string

              let enrichment
              try {
                enrichment = await enrichWithAI({
                  title: pName,
                  brand: details.brand || row.brand || '',
                  description: details.description,
                  features: details.features,
                  category: category || '',
                })
              } catch {}

              if (!enrichment) {
                enrichment = generateEnrichment(
                  pName, row.brand || '',
                  details.description, details.features,
                )
              }

              await enrichDealInDb(dealId, {
                technicalSpecs: JSON.stringify(enrichment.technicalSpecs),
                review: enrichment.review,
                pros: JSON.stringify(enrichment.pros),
                cons: JSON.stringify(enrichment.cons),
                brand: details.brand || undefined,
                imageUrl: details.imageUrl || undefined,
                description: details.description || undefined,
              })
            }
          }
        } catch {}
      }
    } else {
      result.updated++
    }
  } catch (err) {
    result.errors.push(`Error processing "${row.name}" (EAN: ${ean}): ${(err as Error).message}`)
  }
}

export async function cleanupOrphanedDeals(): Promise<number> {
  const db = getDb()
  const result = await db.execute(
    `UPDATE deals SET status = 'draft' WHERE productId != '' AND productId NOT IN (SELECT id FROM products) AND status = 'published'`
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
    const category = normalizeCategory(row.category)
    row.category = category
    row.subcategory = normalizeSubcategory(category, row.subcategory)

    const validation = validateSyncRow(row)
    if (!validation.valid) {
      result.errors.push(`Validation failed for "${row.name}": ${validation.errors.join(', ')}`)
      result.skipped++
      continue
    }
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
    errors: safeParseErrors(row.errors as string),
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
    errors: safeParseErrors(row.errors as string),
  }
}

function safeParseErrors(value: string): string[] {
  if (!value) return []
  try { return JSON.parse(value) as string[] } catch { return [] }
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
