import * as fs from 'fs'
import * as path from 'path'
import { getDb } from '../src/lib/db'
import { generateEnrichment, extractAsin } from '../src/lib/enrich-deal'
import { extractBrand } from '../src/lib/scraping-utils'
import type { InValue } from '@libsql/client'

const CACHE_DIR = path.resolve('scripts', 'enrich-cache')
const REPORT_PATH = path.resolve('enrich-report.md')

interface CacheEntry {
  dealId: string
  storeId: string
  title: string
  url: string
  scrapedAt: string
  source: string
  data: Record<string, any>
}

interface DealRow {
  id: string
  productId: string
  title: string
  storeId: string
  storeName: string
  salePrice: number
  affiliateUrl: string
  storeUrl: string
  category: string
  subcategory: string
  imageUrl: string
  images: string
  description: string
  brand: string
  ean: string
  asin: string
  rating: number
  reviewCount: number
  technicalSpecs: string
  review: string
  pros: string
  cons: string
  tags: string
  metaTitle: string
  metaDescription: string
}

function parseJson(s: string, fallback: any): any {
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : v
  } catch {
    return fallback
  }
}

function isEmpty(s: string | null | undefined): boolean {
  return !s || !s.trim()
}

function deriveTags(brand: string, storeName: string, category: string): string[] {
  const tags: string[] = []
  for (const t of [brand, storeName, category]) {
    if (t && t.trim()) {
      const clean = t.trim().toLowerCase()
      if (!tags.includes(clean)) tags.push(clean)
    }
  }
  return tags.slice(0, 6)
}

async function loadDeals(): Promise<Map<string, DealRow>> {
  const db = getDb()
  const rows = await db.execute({
    sql: `SELECT id, productId, title, storeId, storeName, salePrice, affiliateUrl, storeUrl, category,
                 subcategory, imageUrl, images, description, brand, ean, asin, rating, reviewCount,
                 technicalSpecs, review, pros, cons, tags, metaTitle, metaDescription
          FROM deals WHERE status = ?`,
    args: ['published'],
  })
  const map = new Map<string, DealRow>()
  for (const r of rows.rows) {
    const row = r as unknown as Record<string, any>
    map.set(String(row.id), {
      id: String(row.id),
      productId: String(row.productId || ''),
      title: String(row.title || ''),
      storeId: String(row.storeId || ''),
      storeName: String(row.storeName || ''),
      salePrice: Number(row.salePrice) || 0,
      affiliateUrl: String(row.affiliateUrl || ''),
      storeUrl: String(row.storeUrl || ''),
      category: String(row.category || ''),
      subcategory: String(row.subcategory || ''),
      imageUrl: String(row.imageUrl || ''),
      images: String(row.images || '[]'),
      description: String(row.description || ''),
      brand: String(row.brand || ''),
      ean: String(row.ean || ''),
      asin: String(row.asin || ''),
      rating: Number(row.rating) || 0,
      reviewCount: Number(row.reviewCount) || 0,
      technicalSpecs: String(row.technicalSpecs || '{}'),
      review: String(row.review || ''),
      pros: String(row.pros || '[]'),
      cons: String(row.cons || '[]'),
      tags: String(row.tags || '[]'),
      metaTitle: String(row.metaTitle || ''),
      metaDescription: String(row.metaDescription || ''),
    })
  }
  return map
}

function buildUpdates(deal: DealRow, cache: CacheEntry): Record<string, string | number> | null {
  const d = cache.data || {}
  const updates: Record<string, string | number> = {}
  const url = deal.affiliateUrl || deal.storeUrl

  if (isEmpty(deal.description) && d.description) updates.description = String(d.description).slice(0, 1500)
  if (isEmpty(deal.imageUrl) && d.imageUrl) updates.imageUrl = String(d.imageUrl)
  if ((isEmpty(deal.images) || deal.images === '[]') && Array.isArray(d.images) && d.images.length > 0) {
    updates.images = JSON.stringify(d.images.slice(0, 12))
  }
  if (isEmpty(deal.brand)) {
    if (d.brand) updates.brand = String(d.brand)
    else {
      const fromTitle = extractBrand(deal.title)
      if (fromTitle) updates.brand = fromTitle
    }
  }
  if (isEmpty(deal.ean) && d.ean) updates.ean = String(d.ean).replace(/[^0-9]/g, '').slice(0, 14)
  if (isEmpty(deal.asin)) {
    const asin = extractAsin(url) || (d.asin ? String(d.asin) : '')
    if (asin) updates.asin = asin
  }
  if (!deal.rating && Number(d.rating) > 0) updates.rating = Number(d.rating)
  if (!deal.reviewCount && Number(d.reviewCount) > 0) updates.reviewCount = Number(d.reviewCount)

  const features: string[] = Array.isArray(d.features)
    ? d.features.filter(Boolean)
    : Object.entries(d.specs || {}).map(([k, v]) => `${k}: ${v}`)
  const desc = String(updates.description || '') || deal.description || ''

  const needsReview = isEmpty(deal.review)
  const needsSpecs = isEmpty(deal.technicalSpecs) || deal.technicalSpecs === '{}'
  const needsPros = isEmpty(deal.pros) || deal.pros === '[]'
  const needsCons = isEmpty(deal.cons) || deal.cons === '[]'

  if (needsReview || needsSpecs || needsPros || needsCons) {
    const enrichment = generateEnrichment(deal.title, String(updates.brand || '') || deal.brand || '', desc, features)
    if (needsReview) updates.review = enrichment.review
    if (needsSpecs) updates.technicalSpecs = JSON.stringify(enrichment.technicalSpecs)
    if (needsPros) updates.pros = JSON.stringify(enrichment.pros)
    if (needsCons) updates.cons = JSON.stringify(enrichment.cons)
  }

  if (isEmpty(deal.tags) || deal.tags === '[]') {
    const tags = deriveTags(String(updates.brand || '') || deal.brand, deal.storeName, deal.category)
    if (tags.length > 0) updates.tags = JSON.stringify(tags)
  }

  if (isEmpty(deal.metaTitle)) {
    updates.metaTitle = `${deal.title} — Mejor precio en PesCatch`.slice(0, 70)
  }
  if (isEmpty(deal.metaDescription)) {
    const price = deal.salePrice > 0 ? ` por ${deal.salePrice.toFixed(2).replace('.', ',')} €` : ''
    const snippet = (desc || deal.title).replace(/\s+/g, ' ').slice(0, 110)
    updates.metaDescription = `Descubre ${snippet}${price} en ${deal.storeName || 'PesCatch'}.`.slice(0, 160)
  }

  return Object.keys(updates).length > 0 ? updates : null
}

async function applyUpdates(deal: DealRow, updates: Record<string, string | number>) {
  const db = getDb()
  const sets: string[] = []
  const args: InValue[] = []
  for (const [k, v] of Object.entries(updates)) {
    sets.push(`${k} = ?`)
    args.push(v as InValue)
  }
  sets.push("updatedAt = datetime('now')")
  args.push(deal.id)
  await db.execute({ sql: `UPDATE deals SET ${sets.join(', ')} WHERE id = ?`, args })

  if (deal.productId) {
    const pSets: string[] = []
    const pArgs: InValue[] = []
    if (updates.description) { pSets.push('description = ?'); pArgs.push(updates.description) }
    if (updates.imageUrl) { pSets.push('imageUrl = ?'); pArgs.push(updates.imageUrl) }
    if (updates.images) { pSets.push('images = ?'); pArgs.push(updates.images) }
    if (updates.brand) { pSets.push('brand = ?'); pArgs.push(updates.brand) }
    if (updates.ean) { pSets.push('ean = ?'); pArgs.push(updates.ean) }
    if (updates.asin) { pSets.push('asin = ?'); pArgs.push(updates.asin) }
    if (updates.rating) { pSets.push('rating = ?'); pArgs.push(updates.rating) }
    if (updates.reviewCount) { pSets.push('reviewCount = ?'); pArgs.push(updates.reviewCount) }
    if (updates.review) { pSets.push('review = ?'); pArgs.push(updates.review) }
    if (updates.technicalSpecs) { pSets.push('specs = ?'); pArgs.push(updates.technicalSpecs) }
    if (updates.pros) { pSets.push('pros = ?'); pArgs.push(updates.pros) }
    if (updates.cons) { pSets.push('cons = ?'); pArgs.push(updates.cons) }
    if (updates.tags) { pSets.push('tags = ?'); pArgs.push(updates.tags) }
    if (pSets.length > 0) {
      pSets.push("updatedAt = datetime('now')")
      pArgs.push(deal.productId)
      await db.execute({ sql: `UPDATE products SET ${pSets.join(', ')} WHERE id = ?`, args: pArgs })
    }
  }
}

function writeReport(lines: string[]) {
  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8')
}

async function main() {
  const apply = process.argv.includes('--apply')

  if (!fs.existsSync(CACHE_DIR)) {
    console.error('No existe scripts/enrich-cache/. Primero ejecuta: npx tsx scripts/scrape-enrich-cache.ts')
    process.exit(1)
  }

  const cacheFiles = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'))
  const deals = await loadDeals()

  const report: string[] = []
  report.push('# Enrichment report')
  report.push('')
  report.push(`Modo: ${apply ? 'APLICADO' : 'DRY-RUN (usar --apply para escribir)'}`)
  report.push(`Fecha: ${new Date().toISOString()}`)
  report.push('')
  report.push('| Deal | Store | Campos a rellenar | Imagen | Fuente |')
  report.push('|------|-------|------------------|--------|--------|')

  let withChanges = 0
  let noData = 0
  const missingImages: string[] = []

  for (const file of cacheFiles) {
    const cache: CacheEntry = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf8'))
    const deal = deals.get(cache.dealId)
    if (!deal) continue

    if (cache.source === 'none') {
      noData++
      report.push(`| ${deal.id} | ${deal.storeId} | ⚠️ SIN DATOS | ❌ | ${cache.source} |`)
      if (isEmpty(deal.imageUrl)) missingImages.push(`- ${deal.title} (${deal.storeId})`)
      continue
    }

    const updates = buildUpdates(deal, cache)
    if (!updates) continue

    withChanges++
    const fields = Object.keys(updates).join(', ')
    const hasImage = Boolean(updates.imageUrl || updates.images)
    report.push(`| ${deal.id} | ${deal.storeId} | ${fields} | ${hasImage ? '✅' : '—'} | ${cache.source} |`)
    if (!hasImage && isEmpty(deal.imageUrl)) {
      missingImages.push(`- ${deal.title} (${deal.storeId})`)
    }

    if (apply) {
      try {
        await applyUpdates(deal, updates)
      } catch (e) {
        report.push(`| ERROR actualizando ${deal.id}: ${String(e)} |`)
      }
    }
  }

  report.push('')
  report.push(`## Resumen`)
  report.push('')
  report.push(`- Deals con cambios: ${withChanges}`)
  report.push(`- Deals sin datos scrapeados: ${noData}`)
  if (missingImages.length > 0) {
    report.push('')
    report.push('## Deals sin imagen resuelta (revisión manual)')
    report.push('')
    report.push(missingImages.join('\n'))
  }

  writeReport(report)
  console.log(report.join('\n'))
  console.log(`\nReporte en: ${REPORT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
